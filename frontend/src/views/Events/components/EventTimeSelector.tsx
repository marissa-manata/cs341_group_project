import {
  FormControl,
  FormLabel,
  GridItem,
  Input,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  SimpleGrid,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Event } from '..';

/** Convert a unix timestamp to a local-timezone ISO8601 string. */
function localISOString(d: number) {
  const date = new Date(d);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  const s = date.toISOString();
  const z = s.indexOf('Z');
  if (z !== -1) return s.substring(0, z);
  return s;
}

/** A date-time input component. */
const DateTimeInput: React.FC<{
  value?: string;
  onChange?: (d: number) => void;
}> = ({ value, onChange }) => {
  const [state, setState] = useState(value);

  useEffect(() => setState(value), [value]);

  const onBlur = useCallback(() => {
    try {
      if (!state) throw 'no state';
      const d = Date.parse(state);
      onChange?.(d);
    } catch (_) {
      setState(value);
    }
  }, [state, onChange, value]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setState(e.target.value),
    []
  );

  return (
    <Input
      type="datetime-local"
      value={state}
      onChange={onInputChange}
      onBlur={onBlur}
    />
  );
};

/** Event time selector. Used to select event times. Includes the input boxes and the slider. */
const EventTimeSelector: React.FC<{
  event: Event;
  onChangeStart?: (d: number) => void;
  onChangeEnd?: (d: number) => void;
}> = ({ event, onChangeStart, onChangeEnd }) => {
  const [startTime, setStartTime] = useState(() =>
    Date.parse(event.start_time)
  );
  const [endTime, setEndTime] = useState(() => Date.parse(event.end_time));

  // memoize ISO strings
  const startTimeIso = useMemo(() => localISOString(startTime), [startTime]);
  const endTimeIso = useMemo(() => localISOString(endTime), [endTime]);

  // slider default value
  const sliderDefault = useMemo(
    () => [
      0,
      (Date.parse(event.end_time) - Date.parse(event.start_time)) / (1000 * 60),
    ],
    [event.start_time, event.end_time]
  );

  // the current slider value
  const sliderValue = useMemo(
    () => [
      (startTime - Date.parse(event.start_time)) / (1000 * 60),
      (endTime - Date.parse(event.start_time)) / (1000 * 60),
    ],
    [startTime, endTime, event]
  );

  // handle slider changes
  const onSliderChange = useCallback(
    (v: [number, number]) => {
      setStartTime(Date.parse(event.start_time) + v[0] * 1000 * 60);
      setEndTime(Date.parse(event.start_time) + v[1] * 1000 * 60);
    },
    [event.start_time]
  );

  // effectfully call prop functions when startTime and endTime change
  useEffect(() => onChangeStart?.(startTime), [onChangeStart, startTime]);
  useEffect(() => onChangeEnd?.(endTime), [onChangeEnd, endTime]);

  return (
    <>
      <SimpleGrid columns={2} columnGap={3} rowGap={3}>
        <GridItem>
          <FormControl>
            <FormLabel>Start time</FormLabel>
            <DateTimeInput value={startTimeIso} onChange={setStartTime} />
          </FormControl>
        </GridItem>
        <GridItem>
          <FormControl>
            <FormLabel>End time</FormLabel>
            <DateTimeInput value={endTimeIso} onChange={setEndTime} />
          </FormControl>
        </GridItem>
      </SimpleGrid>
      <RangeSlider
        id="slider"
        defaultValue={sliderDefault}
        min={sliderDefault[0]}
        max={sliderDefault[1]}
        value={sliderValue}
        step={15}
        onChange={onSliderChange}
      >
        <RangeSliderTrack bg="red.100">
          <RangeSliderFilledTrack bg="tomato" />
        </RangeSliderTrack>
        <RangeSliderThumb boxSize={6} index={0} />
        <RangeSliderThumb boxSize={6} index={1} />
      </RangeSlider>
    </>
  );
};

export default EventTimeSelector;
