"use client";

import { useState } from "react";
import { Field, TextInput } from "@/components/ui";

type RoleChoice = "RENTER" | "OWNER";
type AccountKind = "INDIVIDUAL" | "COMPANY";

export function SignupAccountFields({
  defaultRole = "RENTER",
}: {
  defaultRole?: RoleChoice;
}) {
  const [role, setRole] = useState<RoleChoice>(defaultRole);
  const [kind, setKind] = useState<AccountKind>("INDIVIDUAL");
  const isOwner = role === "OWNER";
  const isCompany = kind === "COMPANY";

  return (
    <>
      <fieldset className="field">
        <legend>I want to</legend>
        <div className="account-choice">
          <label>
            <input
              type="radio"
              name="role"
              value="RENTER"
              checked={role === "RENTER"}
              onChange={() => setRole("RENTER")}
            />
            <span className="choice-title">Rent a car</span>
            <span className="choice-copy">Book a vehicle for a trip</span>
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="OWNER"
              checked={role === "OWNER"}
              onChange={() => setRole("OWNER")}
            />
            <span className="choice-title">Offer cars for rent</span>
            <span className="choice-copy">List a car or a fleet</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>This account is for</legend>
        <div className="account-choice">
          <label>
            <input
              type="radio"
              name="accountKind"
              value="INDIVIDUAL"
              checked={kind === "INDIVIDUAL"}
              onChange={() => setKind("INDIVIDUAL")}
            />
            <span className="choice-title">Single person</span>
            <span className="choice-copy">
              {isOwner ? "I own a car to list" : "I'll book and drive myself"}
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="accountKind"
              value="COMPANY"
              checked={kind === "COMPANY"}
              onChange={() => setKind("COMPANY")}
            />
            <span className="choice-title">Company</span>
            <span className="choice-copy">
              {isOwner ? "We'll list a company fleet" : "We'll rent cars for the business"}
            </span>
          </label>
        </div>
      </fieldset>

      <Field label={isCompany ? "Contact person" : "Full name"}>
        <TextInput name="name" required placeholder="Alex Rivera" autoComplete="name" />
      </Field>

      {isCompany ? (
        <>
          <Field label="Company name">
            <TextInput
              name="companyName"
              required
              placeholder="Northwind Logistics"
              autoComplete="organization"
            />
          </Field>
          <Field label="Company registration" hint="Optional — tax ID or business number">
            <TextInput name="companyRegistration" placeholder="REG-10482" />
          </Field>
        </>
      ) : null}
    </>
  );
}
