import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { getOperationName } from '@apollo/client/utilities';
import styled from '@emotion/styled';
import { flip, offset, useFloating } from '@floating-ui/react';
import { v4 } from 'uuid';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { IconPlus } from '@/ui/display/icon';
import { LightIconButton } from '@/ui/input/button/components/LightIconButton';
import { RelationPicker } from '@/ui/input/components/internal/relation-picker/components/RelationPicker';
import { EntityForSelect } from '@/ui/input/relation-picker/types/EntityForSelect';
import { RelationPickerHotkeyScope } from '@/ui/input/relation-picker/types/RelationPickerHotkeyScope';
import { DoubleTextInput } from '@/ui/object/field/meta-types/input/components/internal/DoubleTextInput';
import { FieldDoubleText } from '@/ui/object/field/types/FieldDoubleText';
import { usePreviousHotkeyScope } from '@/ui/utilities/hotkey/hooks/usePreviousHotkeyScope';
import { RecoilScope } from '@/ui/utilities/recoil-scope/components/RecoilScope';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  position: static;
`;

const StyledInputContainer = styled.div`
  background-color: transparent;
  box-shadow: ${({ theme }) => theme.boxShadow.strong};
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
  width: ${({ theme }) => theme.spacing(62.5)};
  & input,
  div {
    background-color: ${({ theme }) => theme.background.primary};
    width: 100%;
  }
  div {
    border-radius: ${({ theme }) => theme.spacing(1)};
    overflow: hidden;
  }
  input {
    display: flex;
    flex-grow: 1;
    padding: ${({ theme }) => theme.spacing(2)};
  }
`;

export const AddPersonToCompany = ({
  companyId,
  peopleIds,
}: {
  companyId: string;
  peopleIds?: string[];
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreationDropdownOpen, setIsCreationDropdownOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open: isDropdownOpen,
    placement: 'right-start',
    middleware: [flip(), offset({ mainAxis: 30, crossAxis: 0 })],
  });

  const handleEscape = () => {
    if (isCreationDropdownOpen) setIsCreationDropdownOpen(false);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  const {
    setHotkeyScopeAndMemorizePreviousScope,
    goBackToPreviousHotkeyScope,
  } = usePreviousHotkeyScope();

  const { findManyQuery, updateOneMutation, createOneMutation } =
    useObjectMetadataItem({
      objectNameSingular: 'person',
    });

  const [updatePerson] = useMutation(updateOneMutation);
  const [createPerson] = useMutation(createOneMutation);

  const handlePersonSelected =
    (companyId: string) => async (newPerson: EntityForSelect | null) => {
      if (!newPerson) return;
      await updatePerson({
        variables: {
          idToUpdate: newPerson.id,
          input: {
            companyId: companyId,
          },
        },
        refetchQueries: [getOperationName(findManyQuery) ?? ''],
      });

      handleClosePicker();
    };

  const handleClosePicker = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
      goBackToPreviousHotkeyScope();
    }
  };

  const handleOpenPicker = () => {
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
      setHotkeyScopeAndMemorizePreviousScope(
        RelationPickerHotkeyScope.RelationPicker,
      );
    }
  };

  const handleCreatePerson = async ({
    firstValue,
    secondValue,
  }: FieldDoubleText) => {
    if (!firstValue && !secondValue) return;
    const newPersonId = v4();

    await createPerson({
      variables: {
        input: {
          companyId: companyId,
          id: newPersonId,
          name: {
            firstName: firstValue,
            lastName: secondValue,
          },
        },
      },
      refetchQueries: [getOperationName(findManyQuery) ?? ''],
    });

    setIsCreationDropdownOpen(false);
  };

  return (
    <RecoilScope>
      <StyledContainer ref={refs.setReference}>
        <LightIconButton
          Icon={IconPlus}
          onClick={handleOpenPicker}
          size="small"
          accent="tertiary"
        />

        {isDropdownOpen && (
          <div ref={refs.setFloating} style={floatingStyles}>
            {isCreationDropdownOpen ? (
              <StyledInputContainer>
                <DoubleTextInput
                  firstValue=""
                  secondValue=""
                  firstValuePlaceholder="First Name"
                  secondValuePlaceholder="Last Name"
                  onClickOutside={handleEscape}
                  onEnter={handleCreatePerson}
                  onEscape={handleEscape}
                  hotkeyScope={RelationPickerHotkeyScope.RelationPicker}
                />
              </StyledInputContainer>
            ) : (
              <RelationPicker
                recordId={''}
                onSubmit={handlePersonSelected(companyId)}
                onCancel={handleClosePicker}
                excludeRecordIds={peopleIds ?? []}
                fieldDefinition={{
                  label: 'Person',
                  iconName: 'IconUser',
                  fieldMetadataId: '',
                  type: FieldMetadataType.Relation,
                  metadata: {
                    relationObjectMetadataNameSingular: 'person',
                    relationObjectMetadataNamePlural: 'people',
                    fieldName: 'person',
                  },
                }}
              />
            )}
          </div>
        )}
      </StyledContainer>
    </RecoilScope>
  );
};
