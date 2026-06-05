/**
 * components/ui/ToggleRow.jsx
 * An Apple-style toggle switch with a label.
 */
export default function ToggleRow({ id, label, checked, onChange }) {
  return (
    <div className="form-group flex-row justify-between">
      <label htmlFor={id}>{label}</label>
      <div className="checkbox-apple">
        <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <label htmlFor={id}></label>
      </div>
    </div>
  );
}
