"use client";

import { useState } from "react";
import { useI18n } from "../i18n/LanguageProvider";

export default function Contact() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const subject = encodeURIComponent(
      `${data.get("type") || "Poptávka"} – ${data.get("name") || ""}`,
    );
    const body = encodeURIComponent(
      [
        `${t.contact.form.name}: ${data.get("name")}`,
        `${t.contact.form.email}: ${data.get("email")}`,
        `${t.contact.form.phone}: ${data.get("phone")}`,
        `${t.contact.form.type}: ${data.get("type")}`,
        `${t.contact.form.date}: ${data.get("date")}`,
        "",
        `${t.contact.form.message}:`,
        `${data.get("message")}`,
      ].join("\n"),
    );
    window.location.href = `mailto:teresiephoto@email.cz?subject=${subject}&body=${body}`;
    setSent(true);
    form.reset();
  }

  return (
    <section
      id="contact"
      className="relative bg-[var(--foreground)] text-[var(--background)] py-24 md:py-32"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
        <div className="md:col-span-5">
          <span className="eyebrow !text-[var(--accent)]">
            {t.contact.eyebrow}
          </span>
          <h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
            {t.contact.title}
          </h2>
          <p className="mt-5 text-[var(--background)]/70 text-lg">
            {t.contact.lead}
          </p>

          <dl className="mt-10 space-y-5 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-[var(--accent)]">
                {t.contact.info.cityLabel}
              </dt>
              <dd className="mt-1 text-lg">{t.contact.info.city}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-[var(--accent)]">
                {t.contact.info.emailLabel}
              </dt>
              <dd className="mt-1 text-lg">
                <a
                  href="mailto:teresiephoto@email.cz"
                  className="hover:text-[var(--accent)]"
                >
                  teresiephoto@email.cz
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-[var(--accent)]">
                {t.contact.info.phoneLabel}
              </dt>
              <dd className="mt-1 text-lg">
                <a
                  href="tel:+420725430480"
                  className="hover:text-[var(--accent)]"
                >
                  +420 725 430 480
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex gap-4">
            <a
              href="https://www.instagram.com/teresiephoto/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--background)]/30 px-4 py-2 text-xs uppercase tracking-wider hover:bg-[var(--accent)] hover:border-[var(--accent)]"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/tereza.flaskova.9"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--background)]/30 px-4 py-2 text-xs uppercase tracking-wider hover:bg-[var(--accent)] hover:border-[var(--accent)]"
            >
              Facebook
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="md:col-span-7 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field name="name" label={t.contact.form.name} required />
            <Field
              name="email"
              type="email"
              label={t.contact.form.email}
              required
            />
            <Field name="phone" type="tel" label={t.contact.form.phone} />
            <SelectField
              name="type"
              label={t.contact.form.type}
              options={[...t.contact.form.typeOptions]}
            />
          </div>
          <Field name="date" type="date" label={t.contact.form.date} />
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--accent)]">
              {t.contact.form.message}
            </label>
            <textarea
              name="message"
              rows={5}
              placeholder={t.contact.form.messagePlaceholder}
              className="mt-2 w-full rounded-sm border border-[var(--background)]/20 bg-transparent p-3 text-base text-[var(--background)] placeholder:text-[var(--background)]/40 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              className="btn !bg-[var(--accent)] !text-white hover:!bg-[var(--accent-dark)]"
            >
              {t.contact.form.submit}
            </button>
            {sent && (
              <span className="text-sm text-[var(--accent)]">
                {t.contact.form.success}
              </span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-[var(--accent)]">
        {label}
        {required && " *"}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-sm border border-[var(--background)]/20 bg-transparent p-3 text-base text-[var(--background)] placeholder:text-[var(--background)]/40 focus:border-[var(--accent)] focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-[var(--accent)]">
        {label}
      </label>
      <select
        name={name}
        className="mt-2 w-full rounded-sm border border-[var(--background)]/20 bg-[var(--foreground)] p-3 text-base text-[var(--background)] focus:border-[var(--accent)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
