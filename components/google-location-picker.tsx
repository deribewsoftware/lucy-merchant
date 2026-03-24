"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
  type Libraries,
} from "@react-google-maps/api";

const libraries: Libraries = ["places"];

const DEFAULT_CENTER = { lat: 9.032, lng: 38.7469 };

const mapContainerClass =
  "overflow-hidden rounded-xl border border-base-300/80 bg-base-200/40 shadow-inner dark:border-zinc-700/80 dark:bg-zinc-900/40";

function regionFromPlace(place: google.maps.places.PlaceResult): string {
  const comps = place.address_components ?? [];
  const get = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name;
  const locality =
    get("locality") ||
    get("administrative_area_level_2") ||
    get("sublocality") ||
    get("sublocality_level_1");
  const admin = get("administrative_area_level_1");
  const country = get("country");
  const parts = [locality, admin, country].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(", ");
  return place.formatted_address?.trim() ?? "";
}

export type GoogleLocationPickerProps = {
  value: string;
  onChange: (text: string) => void;
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
  label: string;
  required?: boolean;
  helperText?: string;
  variant?: "daisy" | "zinc";
  /** Full formatted address vs city/region (for ship-from filters). */
  addressMode?: "full" | "region";
  showMap?: boolean;
  mapHeightPx?: number;
  inputId?: string;
  /** When editing saved data, show the pin without re-searching. */
  initialLatitude?: number | null;
  initialLongitude?: number | null;
};

function inputClasses(variant: "daisy" | "zinc"): string {
  if (variant === "daisy") {
    return "input input-bordered w-full rounded-lg border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40";
  }
  return "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500";
}

function labelClasses(variant: "daisy" | "zinc"): string {
  if (variant === "daisy") {
    return "label-text font-medium text-base-content";
  }
  return "text-sm font-medium text-zinc-700 dark:text-zinc-300";
}

function FallbackField({
  value,
  onChange,
  label,
  required,
  helperText,
  variant,
  inputId,
  hint,
}: Pick<
  GoogleLocationPickerProps,
  "value" | "onChange" | "label" | "required" | "helperText" | "variant" | "inputId"
> & { hint?: string }) {
  const v = variant ?? "daisy";
  return (
    <div className="form-control w-full gap-1">
      <label className="label py-0" htmlFor={inputId}>
        <span className={labelClasses(v)}>{label}</span>
      </label>
      {helperText ? (
        <p
          className={
            v === "daisy"
              ? "text-xs text-base-content/60"
              : "text-xs text-zinc-500 dark:text-zinc-400"
          }
        >
          {helperText}
        </p>
      ) : null}
      <textarea
        id={inputId}
        required={required}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          v === "daisy"
            ? "textarea textarea-bordered w-full rounded-lg"
            : "min-h-[5rem] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        }
        placeholder="Street, building, city…"
      />
      {hint ? (
        <p
          className={
            v === "daisy"
              ? "text-xs text-base-content/50"
              : "text-xs text-zinc-500 dark:text-zinc-400"
          }
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InnerProps = GoogleLocationPickerProps & { apiKey: string };

function GoogleLocationPickerWithKey({
  apiKey,
  value,
  onChange,
  onCoordinatesChange,
  label,
  required,
  helperText,
  variant = "daisy",
  addressMode = "full",
  showMap = true,
  mapHeightPx = 180,
  inputId,
  initialLatitude,
  initialLongitude,
}: InnerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "lm-google-maps-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    () => {
      const lat = initialLatitude;
      const lng = initialLongitude;
      if (
        lat != null &&
        lng != null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {
        return { lat, lng };
      }
      return null;
    },
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    }),
    [],
  );

  const onPlaceChanged = useCallback(() => {
    const ac = acRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    const loc = place.geometry?.location;
    if (!loc) return;
    const lat = loc.lat();
    const lng = loc.lng();
    const text =
      addressMode === "region"
        ? regionFromPlace(place)
        : place.formatted_address?.trim() ?? "";
    if (!text) return;
    onChange(text);
    setMarker({ lat, lng });
    onCoordinatesChange?.(lat, lng);
  }, [addressMode, onChange, onCoordinatesChange]);

  const clear = useCallback(() => {
    onChange("");
    setMarker(null);
    onCoordinatesChange?.(null, null);
  }, [onChange, onCoordinatesChange]);

  const v = variant;
  const hintLoad =
    loadError != null
      ? "Google Maps could not load. Check your API key and Places/Maps JavaScript API."
      : undefined;

  if (!isLoaded || loadError) {
    return (
      <FallbackField
        value={value}
        onChange={onChange}
        label={label}
        required={required}
        helperText={helperText}
        variant={v}
        inputId={inputId}
        hint={hintLoad}
      />
    );
  }

  const center = marker ?? DEFAULT_CENTER;
  const zoom = marker ? 15 : 11;

  return (
    <div className="form-control w-full gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label className="label min-h-0 flex-1 py-0" htmlFor={inputId}>
          <span className={labelClasses(v)}>{label}</span>
        </label>
        <button
          type="button"
          onClick={clear}
          className={
            v === "daisy"
              ? "btn btn-ghost btn-sm shrink-0 text-base-content/70"
              : "shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          }
        >
          Clear location
        </button>
      </div>
      {helperText ? (
        <p
          className={
            v === "daisy"
              ? "text-xs text-base-content/60"
              : "text-xs text-zinc-500 dark:text-zinc-400"
          }
        >
          {helperText}
        </p>
      ) : null}
      <Autocomplete
        onLoad={(ac) => {
          acRef.current = ac;
        }}
        onUnmount={() => {
          acRef.current = null;
        }}
        fields={["formatted_address", "geometry", "address_components"]}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          id={inputId}
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className={inputClasses(v)}
          placeholder={
            addressMode === "region"
              ? "Search city or region…"
              : "Search address on map…"
          }
        />
      </Autocomplete>
      {showMap ? (
        <div
          className={mapContainerClass}
          style={{ height: mapHeightPx }}
          role="presentation"
        >
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={zoom}
            options={mapOptions}
          >
            {marker ? <Marker position={marker} /> : null}
          </GoogleMap>
        </div>
      ) : null}
      <p
        className={
          v === "daisy"
            ? "text-[11px] leading-snug text-base-content/50"
            : "text-[11px] leading-snug text-zinc-500 dark:text-zinc-400"
        }
      >
        Pick a suggestion to pin the map. You can still edit the text after
        selecting.
      </p>
    </div>
  );
}

export function GoogleLocationPicker(props: GoogleLocationPickerProps) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return (
      <FallbackField
        value={props.value}
        onChange={props.onChange}
        label={props.label}
        required={props.required}
        helperText={props.helperText}
        variant={props.variant}
        inputId={props.inputId}
        hint="Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable search and map preview."
      />
    );
  }
  return <GoogleLocationPickerWithKey {...props} apiKey={key} />;
}
