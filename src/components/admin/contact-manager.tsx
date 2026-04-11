"use client";

import { useState } from "react";
import { User, Phone, Mail, Star, Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactPerson {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
  notes?: string | null;
}

interface ContactManagerProps {
  clientId: string;
  initialContacts: ContactPerson[];
}

interface ContactFormState {
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes: string;
}

const emptyForm: ContactFormState = {
  name: "",
  role: "",
  email: "",
  phone: "",
  isPrimary: false,
  notes: "",
};

function contactToForm(c: ContactPerson): ContactFormState {
  return {
    name: c.name,
    role: c.role ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    isPrimary: c.isPrimary,
    notes: c.notes ?? "",
  };
}

export function ContactManager({ clientId, initialContacts }: ContactManagerProps) {
  const [contacts, setContacts] = useState<ContactPerson[]>(initialContacts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ContactFormState>(emptyForm);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowAddForm(true);
    setError(null);
  }

  function openEdit(contact: ContactPerson) {
    setForm(contactToForm(contact));
    setEditingId(contact.id);
    setShowAddForm(false);
    setError(null);
  }

  function cancelForm() {
    setShowAddForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !form.name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/kunden/${clientId}/kontakte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          isPrimary: form.isPrimary,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Hinzufügen");
        return;
      }

      // If new contact is primary, update others in local state
      if (form.isPrimary) {
        setContacts((prev) =>
          prev.map((c) => ({ ...c, isPrimary: false }))
        );
      }
      setContacts((prev) => [...prev, data.contact]);
      setShowAddForm(false);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !editingId || !form.name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/kunden/${clientId}/kontakte/${editingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: form.name.trim(),
            role: form.role.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            isPrimary: form.isPrimary,
            notes: form.notes.trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Speichern");
        return;
      }

      setContacts((prev) =>
        prev.map((c) => {
          if (form.isPrimary && c.id !== editingId) return { ...c, isPrimary: false };
          if (c.id === editingId) return data.contact;
          return c;
        })
      );
      setEditingId(null);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(contactId: string) {
    if (deletingId) return;
    if (!confirm("Kontakt wirklich löschen?")) return;

    setDeletingId(contactId);
    try {
      const res = await fetch(
        `/api/admin/kunden/${clientId}/kontakte/${contactId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        if (editingId === contactId) cancelForm();
      }
    } finally {
      setDeletingId(null);
    }
  }

  const activeForm = showAddForm || editingId !== null;

  return (
    <div className="space-y-3">
      {/* Contact cards */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact.id}>
              <div className="flex items-start gap-3 px-4 py-3 bg-dark-200 border border-border rounded-xl">
                <div className="mt-0.5 p-1.5 bg-dark-300 rounded-lg shrink-0">
                  <User size={14} className="text-ink-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-surface">
                      {contact.name}
                    </span>
                    {contact.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        <Star size={10} />
                        Hauptkontakt
                      </span>
                    )}
                    {contact.role && (
                      <span className="text-xs text-ink-muted">{contact.role}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent transition-colors"
                      >
                        <Mail size={11} />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent transition-colors"
                      >
                        <Phone size={11} />
                        {contact.phone}
                      </a>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                      {contact.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(contact)}
                    disabled={!!editingId && editingId !== contact.id}
                    className="p-1.5 text-ink-muted hover:text-surface transition-colors rounded-lg hover:bg-dark-300 disabled:opacity-50"
                    title="Bearbeiten"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    disabled={deletingId === contact.id}
                    className="p-1.5 text-ink-muted hover:text-red-400 transition-colors rounded-lg hover:bg-dark-300 disabled:opacity-50"
                    title="Löschen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === contact.id && (
                <ContactForm
                  form={form}
                  setForm={setForm}
                  onSubmit={handleEdit}
                  onCancel={cancelForm}
                  submitting={submitting}
                  error={error}
                  isEdit
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {contacts.length === 0 && !showAddForm && (
        <p className="text-sm text-ink-muted py-4 text-center">
          Noch keine Kontaktpersonen
        </p>
      )}

      {/* Add form */}
      {showAddForm && (
        <ContactForm
          form={form}
          setForm={setForm}
          onSubmit={handleAdd}
          onCancel={cancelForm}
          submitting={submitting}
          error={error}
          isEdit={false}
        />
      )}

      {/* Add button */}
      {!activeForm && (
        <Button size="sm" variant="ghost" onClick={openAdd}>
          <Plus size={14} />
          Kontakt hinzufügen
        </Button>
      )}
    </div>
  );
}

interface ContactFormProps {
  form: ContactFormState;
  setForm: React.Dispatch<React.SetStateAction<ContactFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
  isEdit: boolean;
}

function ContactForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  error,
  isEdit,
}: ContactFormProps) {
  function field(key: keyof ContactFormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-2 space-y-3 bg-dark-200 border border-border rounded-xl p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Name"
          value={form.name}
          onChange={field("name")}
          placeholder="Max Mustermann"
          required
          disabled={submitting}
        />
        <Input
          label="Rolle"
          value={form.role}
          onChange={field("role")}
          placeholder="Geschäftsführer"
          disabled={submitting}
        />
        <Input
          label="E-Mail"
          type="email"
          value={form.email}
          onChange={field("email")}
          placeholder="max@example.de"
          disabled={submitting}
        />
        <Input
          label="Telefon"
          type="tel"
          value={form.phone}
          onChange={field("phone")}
          placeholder="+49 711 123456"
          disabled={submitting}
        />
      </div>
      <Textarea
        label="Notizen"
        value={form.notes}
        onChange={field("notes")}
        placeholder="Interne Notizen zu dieser Person..."
        rows={2}
        disabled={submitting}
      />
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isPrimary}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))
          }
          disabled={submitting}
          className="w-4 h-4 rounded accent-accent"
        />
        <span className="text-sm text-surface">Hauptkontakt</span>
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          <X size={13} />
          Abbrechen
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={submitting}
          disabled={!form.name.trim()}
        >
          {isEdit ? "Speichern" : "Hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
