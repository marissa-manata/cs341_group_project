/*
Written by Adam Grunwald
Mousover help component
*/

/* eslint-disable react/prop-types */
import { QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  Text,
} from '@chakra-ui/react';

/** A help bubble. */
const Help: React.FC<{ text: string[]; header?: string; size?: string }> = ({
  text,
  header,
  size = 'md',
}) => (
  <Popover>
    <PopoverTrigger>
      <IconButton
        aria-label="Help"
        size={size}
        variant="ghost"
        p={1}
        icon={<QuestionOutlineIcon />}
      />
    </PopoverTrigger>
    <PopoverContent>
      <PopoverArrow />
      <PopoverCloseButton />
      <PopoverHeader>{header}</PopoverHeader>
      <PopoverBody>
        <Stack spacing={2}>
          {text.map((item) => {
            return <Text key={item}>{item}</Text>;
          })}
        </Stack>
      </PopoverBody>
    </PopoverContent>
  </Popover>
);

export default Help;
