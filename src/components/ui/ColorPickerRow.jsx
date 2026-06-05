/**
 * components/ui/ColorPickerRow.jsx
 * A colour picker with live hex display.
 */
export default function ColorPickerRow({ id, label, value, onChange }) {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="color-picker-wrapper">
        <input
          type="color"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="color-hex">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}
