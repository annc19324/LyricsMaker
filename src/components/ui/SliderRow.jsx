/**
 * components/ui/SliderRow.jsx
 * A labelled range slider with a live value display.
 */
export default function SliderRow({ id, label, min, max, step = 1, value, onChange, displayValue }) {
  return (
    <div className="form-group">
      <div className="slider-header">
        <label htmlFor={id}>{label}</label>
        <span className="slider-value">{displayValue ?? value}</span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
