'use client';

/**
 * Renders one connector-declared connection input.
 *
 * Cloud, file and app connectors each need a different set of inputs, so the set
 * travels with the connector (`Connector.fields`) and this maps it onto the
 * design system's controls. Databases are handled separately — their form is the
 * same on every engine, so it is written out with translated labels instead of
 * being carried in the catalogue.
 */
import { Input } from '@atoms/Input';
import { Field } from '@molecules/Field';
import { Listbox } from '@molecules/Listbox';
import { PasswordInput } from '@molecules/PasswordInput';
import type { ConnectorField } from '@shared/mock/connectors';

export function ConnectorFieldInput({
  field,
  value,
  errorMessage,
  onValueChange,
}: {
  field: ConnectorField;
  value: string;
  errorMessage?: string | undefined;
  onValueChange: (value: string) => void;
}) {
  if (field.control === 'password') {
    return (
      <PasswordInput
        label={field.label}
        value={value}
        onValueChange={onValueChange}
        isRequired={field.isRequired}
        errorMessage={errorMessage}
        autoComplete="new-password"
        size="lg"
        fullWidth
      />
    );
  }

  if (field.control === 'select') {
    const options = (field.options ?? []).map((option) => ({ value: option, label: option }));
    return (
      <Listbox
        label={field.label}
        isRequired={field.isRequired}
        errorMessage={errorMessage}
        options={options}
        value={value === '' ? (options[0]?.value ?? '') : value}
        onValueChange={onValueChange}
        size="lg"
        fullWidth
      />
    );
  }

  return (
    <Field label={field.label} isRequired={field.isRequired} errorMessage={errorMessage}>
      {(control) => (
        <Input
          {...control}
          type={field.control === 'number' ? 'number' : 'text'}
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
          }}
          size="lg"
          fullWidth
        />
      )}
    </Field>
  );
}
