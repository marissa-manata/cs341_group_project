import React from 'react';
import { Box, FormLabel, Grid, GridItem } from '@chakra-ui/react';

/** An editor grid container. */
const EditorGrid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Grid gridTemplateColumns="200px 1fr" rowGap={3} columnGap={3}>
    {children}
  </Grid>
);

/** A field to be used in an `EditorGrid`. */
export const EditorField: React.FC<{
  label: string;
  children?: React.ReactNode;
}> = ({ label, children }) => (
  <>
    <FormLabel>{label}</FormLabel>
    <Box>{children}</Box>
  </>
);

/** A container that spans a whole row in an `EditorGrid`. */
export const EditorRow: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <GridItem colSpan={2}>{children}</GridItem>;

export default EditorGrid;
