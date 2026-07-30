export function BeaconMark() {
  return (
    <span className="beacon-mark" aria-hidden="true">
      <span className="beacon-ring beacon-ring-outer" />
      <span className="beacon-ring beacon-ring-inner" />
      <span className="beacon-core" />
    </span>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <BeaconMark />
      <span>
        Open Beacon
        <small>Learn. Support. Grow.</small>
      </span>
    </span>
  );
}
