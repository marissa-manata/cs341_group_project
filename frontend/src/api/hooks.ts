import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import fetchClient from './fetch';

/**
 * The return type of `useInputState`.
 *
 * Helper object that provides props to input components whose
 * state will be managed by `useInputState` (and this object).
 */
export type InputState<T, Element extends HTMLElement> = {
  /**
   * The props to be placed on the input component whose state should be controlled.
   */
  props: { onChange: (e: ChangeEvent<Element>) => void } & Record<string, T>;
  /**
   * The current value of the input state.
   */
  value: T;
  /**
   * Set the value of this input state.
   */
  setValue: (newValue: T) => void;
};

/**
 * Hook that allows input components' states to be easily controlled and wrapped.
 * @param initial The initial state.
 * @param valueField The value field key. Defaults to 'value'. When using checkboxes, use 'checked'.
 * @returns The `InputState`.
 */
export const useInputState = <
  T,
  Element extends HTMLElement = HTMLInputElement
>(
  initial: T,
  valueField = 'value'
): InputState<T, Element> => {
  const [state, setState] = useState(initial);

  /// wrapper callback that maps event data to new state
  const wrapper = useCallback(
    (e: ChangeEvent<Element>) =>
      setState(
        e.target[valueField as keyof ChangeEvent<Element>['target']] as T
      ),
    [valueField]
  );

  // return the InputState<T, Element> object
  return {
    props: { [valueField]: state, onChange: wrapper } as InputState<
      T,
      Element
    >['props'],
    value: state,
    setValue: setState,
  };
};

/**
 * An object that represents the data(?), error(?), and loading state
 * of a resource fetched by an HTTP request.
 */
export type HttpResource<T, E = { error: string }> = {
  /**
   * Whether or not this resource is still loading.
   */
  loading: boolean;
  /**
   * The data of this resource, if it is present.
   */
  data?: T;
  /**
   * The error of this resource, if it is present.
   */
  error?: E;
};

/**
 * A hook that is used to check if a component is still mounted.
 *
 * Returns a function that, when called, returns a boolean representing
 * the component's mount state.
 */
export const useMounted = () => {
  const ref = useRef(true);

  useEffect(() => {
    // set the ref to true on mount
    ref.current = true;
    return () => {
      // on unmount, set ref to false
      ref.current = false;
    };
  }, []);

  return useCallback(() => ref.current, []);
};

/**
 * Hook that can be used to fetch an `HttpResource` and then possibly update
 * it later as it is stateful and returns a state setter.
 * @param route The route of the resource to fetch.
 * @returns [The resource, state setter]
 */
export const useStatefulFetchResource = <T, E = { error: string }>(
  route: string
): [
  HttpResource<T, E>,
  (
    newValue:
      | HttpResource<T, E>
      | ((oldValue: HttpResource<T, E>) => HttpResource<T, E>)
  ) => void
] => {
  const isMounted = useMounted();
  const [state, setState] = useState<HttpResource<T, E>>({ loading: true });

  // on mount...
  useEffect(() => {
    // set resource as loading
    setState((s) => ({ ...s, loading: true }));

    // GET route
    fetchClient(route, { method: 'GET' })
      .then(async (res) => {
        // if mounted...
        if (isMounted())
          // set state w/ provided data
          setState({
            loading: false,
            [res.ok ? 'data' : 'error']: await res.json(),
          });
      })
      .catch((_err) => {
        // if mounted...
        if (isMounted())
          // set state w/ provided error
          setState({
            loading: false,
            error: { error: 'http_request_failed' } as E,
          });
      });
  }, [route, isMounted]);

  return [state, setState];
};

/**
 * Fetch a resource over HTTP, returning a dynamic `HttpResource`.
 * @param route The resource's route.
 * @returns The `HttpResource`.
 */
export const useFetchResource = <T, E = { error: string }>(
  route: string
): HttpResource<T, E> => {
  const [state] = useStatefulFetchResource<T, E>(route);
  return state;
};
