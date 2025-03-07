import { useState, useEffect, useRef } from "react";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef
} from "@vis.gl/react-google-maps";

const API_KEY = import.meta.env.VITE_MAPS_API;

export default function GoogleMap({
  selectedPlace
}: {
  selectedPlace: google.maps.places.PlaceResult | null;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <APIProvider
      apiKey={API_KEY}
      solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
    >
      <Map
        mapId={"bf51a910020fa25a"}
        defaultZoom={17}
        defaultCenter={{ lat: 32.881366488744234, lng: -117.23759147899332 }}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        className="w-full h-[30vh]"
      >
        <AdvancedMarker ref={markerRef} position={null} />
      </Map>
      <MapHandler place={selectedPlace} marker={marker} />
    </APIProvider>
  );
}

interface MapHandlerProps {
  place: google.maps.places.PlaceResult | null;
  marker: google.maps.marker.AdvancedMarkerElement | null;
}

const MapHandler = ({ place, marker }: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !place || !marker) return;

    if (place.geometry?.viewport) {
      map.fitBounds(place.geometry?.viewport);
    }
    marker.position = place.geometry?.location;
  }, [map, place, marker]);

  return null;
};

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

export const PlaceAutocomplete = ({
  onPlaceSelect
}: PlaceAutocompleteProps) => {
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ["geometry", "name", "formatted_address"]
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener("place_changed", () => {
      onPlaceSelect(placeAutocomplete.getPlace());
    });
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div className="places-autocomplete border-black border  rounded-lg">
      <input
        ref={inputRef}
        name="location"
        placeholder="Location"
        className="px-3 h-12 w-full rounded-lg"
      />
    </div>
  );
};
