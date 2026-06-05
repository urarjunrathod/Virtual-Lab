// Material presets — auto-assign density, friction, restitution, color
export const MATERIALS = {
  custom:   { label: 'Custom',   density: 0.001,  friction: 0.10, restitution: 0.50, color: '#3b82f6' },
  wood:     { label: 'Wood',     density: 0.0007, friction: 0.40, restitution: 0.30, color: '#a16207' },
  steel:    { label: 'Steel',    density: 0.0078, friction: 0.30, restitution: 0.20, color: '#9ca3af' },
  rubber:   { label: 'Rubber',   density: 0.0012, friction: 0.80, restitution: 0.90, color: '#dc2626' },
  ice:      { label: 'Ice',      density: 0.0009, friction: 0.02, restitution: 0.10, color: '#7dd3fc' },
  concrete: { label: 'Concrete', density: 0.0024, friction: 0.65, restitution: 0.15, color: '#57534e' },
  plastic:  { label: 'Plastic',  density: 0.0010, friction: 0.25, restitution: 0.55, color: '#14b8a6' },
};
