import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  ButtonGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import fetchClient from 'src/api/fetch';
import { useNavigate } from 'react-router-dom';
import { HttpResource } from 'src/api/hooks';

// export function useActiveCallback<T extends { active: boolean }>(
//   setState: (cb: (state: T) => T) => void
// ) {
//   return useCallback(
//     (active: boolean) => {
//       setState((o: T) => ({ ...o, active } as T));
//     },
//     [setState]
//   );
// }

export function useActiveCallbackResource<T extends { active: boolean }>(
  setState: (cb: (state: HttpResource<T>) => HttpResource<T>) => void
) {
  return useCallback(
    (active: boolean) => {
      setState((o) => ({ ...o, data: { ...(o.data ?? {}), active } as T }));
    },
    [setState]
  );
}

/** Reusable remove buttons for any objects that share a similar API for deactivating/deleting. */
const RemoveButtons: React.FC<{
  endpoint: string;
  active: boolean;
  onActiveChange?: (active: boolean) => void;
  returnTo?: string;
}> = ({ endpoint, active, onActiveChange, returnTo }) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newActive, setNewActive] = useState<boolean | undefined>();
  const [activeLoading, setActiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // whether or not the object is active
  const activeValue = useMemo(() => newActive ?? active, [active, newActive]);

  // toggle this object being active
  const onToggleActive = useCallback(() => {
    if (deleteLoading || activeLoading) return;
    setActiveLoading(true);

    // PATCH the API with the new value
    fetchClient(endpoint + `/active?value=${!activeValue}`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        setActiveLoading(false);
        if (res.ok) {
          setNewActive(!activeValue);
          onActiveChange?.(!activeValue);
        } else {
          console.log('Error (de)activating', res);
        }
      })
      .catch((e) => {
        setActiveLoading(false);
        console.log('Error (de)activating', e);
      });
  }, [deleteLoading, activeLoading, activeValue, endpoint, onActiveChange]);

  // delete this object w/ the API
  const onDelete = useCallback(() => {
    if (deleteLoading || activeLoading) return;
    setDeleteLoading(true);
    onClose();

    fetchClient(endpoint, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        setDeleteLoading(false);
        if (res.ok) {
          navigate(returnTo ?? '/');
        } else {
          console.log('Error deleting', res);
        }
      })
      .catch((e) => {
        console.log('Error deleting', e);
        setDeleteLoading(false);
      });
  }, [endpoint, deleteLoading, activeLoading, navigate, onClose, returnTo]);

  return (
    <>
      <ButtonGroup isAttached variant="outline">
        <Button
          colorScheme={activeValue ? 'red' : 'green'}
          variant="solid"
          onClick={onToggleActive}
          isLoading={activeLoading}
          isDisabled={activeLoading}
        >
          {activeValue ? 'Deactivate' : 'Activate'}
        </Button>
        <Button
          onClick={onOpen}
          isLoading={deleteLoading}
          isDisabled={deleteLoading}
        >
          Delete
        </Button>
      </ButtonGroup>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Really delete?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            This will permanently delete the object. If you are looking to soft
            delete the object, use the <b>deactivate</b> feature instead.
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={onDelete}>
              Delete
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RemoveButtons;
