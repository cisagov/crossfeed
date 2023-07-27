import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Organization, OrganizationTag } from 'types';
import {
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Switch,
  Button,
  FormControlLabel,
  Box,
  Chip,
  Grid,
  createFilterOptions
} from '@mui/material';

import { useAuthContext } from 'context';

const PREFIX = 'OrganizationForm';

const classes = {
  chip: `${PREFIX}-chip`,
  headerRow: `${PREFIX}-headerRow`
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
  [`& .${classes.chip}`]: {
    backgroundColor: '#C4C4C4',
    color: 'white',
    marginRight: '10px'
  },

  [`& .${classes.headerRow}`]: {
    padding: '0.5rem 0',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    flexWrap: 'wrap',
    '& label': {
      flex: '1 0 100%',
      fontWeight: 'bolder',
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem 0',
      '@media screen and (min-width: 640px)': {
        flex: '0 0 220px',
        padding: 0
      }
    },
    '& span': {
      display: 'block',
      flex: '1 1 auto',
      marginLeft: 'calc(1rem + 20px)',
      '@media screen and (min-width: 640px)': {
        marginLeft: 'calc(1rem + 20px)'
      },
      '@media screen and (min-width: 1024px)': {
        marginLeft: 0
      }
    }
  }
}));

interface AutocompleteType extends Partial<OrganizationTag> {
  title?: string;
}

export interface OrganizationFormValues {
  name: string;
  rootDomains: string;
  ipBlocks: string;
  isPassive: boolean;
  tags: OrganizationTag[];
}

export const OrganizationForm: React.FC<{
  organization?: Organization;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (values: Object) => Promise<void>;
  type: string;
  parent?: Organization;
}> = ({ organization, onSubmit, type, open, setOpen, parent }) => {
  const defaultValues = () => ({
    name: organization ? organization.name : '',
    rootDomains: organization ? organization.rootDomains.join(', ') : '',
    ipBlocks: organization ? organization.ipBlocks.join(', ') : '',
    isPassive: organization ? organization.isPassive : false,
    tags: []
  });

  const { apiGet } = useAuthContext();

  const fetchTags = useCallback(async () => {
    try {
      const tags = await apiGet<OrganizationTag[]>(`/organizations/tags`);
      setTags(tags);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const [values, setValues] = useState<OrganizationFormValues>(defaultValues);
  const [tagValue, setTagValue] = React.useState<AutocompleteType | null>(null);
  const filter = createFilterOptions<AutocompleteType>();
  const [tags, setTags] = useState<AutocompleteType[]>([]);
  const [chosenTags, setChosenTags] = useState<AutocompleteType[]>([]);
  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  return (
    <StyledDialog
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="form-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        Create new {parent ? 'Team' : 'Organization'}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          id="name"
          inputProps={{ maxLength: 250 }}
          name="name"
          label="Organization Name"
          type="text"
          fullWidth
          value={values.name}
          onChange={onTextChange}
        />
        <TextField
          margin="dense"
          id="rootDomains"
          name="rootDomains"
          label="Root Domains"
          type="text"
          fullWidth
          value={values.rootDomains}
          onChange={onTextChange}
        />
        <TextField
          margin="dense"
          id="ipBlocks"
          name="ipBlocks"
          label="IP Blocks"
          type="text"
          fullWidth
          value={values.ipBlocks}
          onChange={onTextChange}
        />
        <div className={classes.headerRow}>
          <label>Tags</label>
        </div>
        <span>
          {chosenTags &&
            chosenTags.length > 0 &&
            chosenTags.map((value: AutocompleteType, index: number) => (
              <Chip
                className={classes.chip}
                key={index}
                label={typeof value === 'string' ? value : value.name}
                onDelete={() => {
                  const tagIndex = chosenTags?.indexOf(value);
                  if (tagIndex >= 0) {
                    chosenTags?.splice(tagIndex, 1);
                    setChosenTags([...chosenTags]);
                  }
                }}
              ></Chip>
            ))}
        </span>
        <Box>Select an existing tag or add a new one.</Box>
        <Grid container>
          <Grid item xs={10}>
            <Autocomplete
              value={tagValue}
              onInputChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  setTagValue({
                    name: newValue
                  });
                } else {
                  setTagValue(newValue);
                }
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                // Suggest the creation of a new value
                if (
                  params.inputValue !== '' &&
                  !filtered.find(
                    (tag) =>
                      tag.name?.toLowerCase() ===
                      params.inputValue.toLowerCase()
                  )
                ) {
                  filtered.push({
                    name: params.inputValue,
                    title: `Add "${params.inputValue}"`
                  });
                }
                return filtered;
              }}
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              options={tags.filter((i) => !chosenTags.includes(i))}
              getOptionLabel={(option) => {
                if (typeof option === 'string') {
                  return option;
                }
                return (option as AutocompleteType).name ?? '';
              }}
              renderOption={(props, option, { selected }) => {
                if (option.title) return option.title;
                return option.name ?? '';
              }}
              fullWidth
              freeSolo
              renderInput={(params) => (
                <TextField {...params} variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                minWidth: '100%',
                minHeight: '100%'
              }}
              variant="contained"
              color="primary"
              onClick={() => {
                if (chosenTags && tagValue) {
                  if (chosenTags.indexOf({ title: tagValue.title }) === -1) {
                    setChosenTags((e) => [...e, tagValue]);
                  }
                }
                setTagValue(null);
              }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
        <br></br>
        <br></br>
        <FormControlLabel
          control={
            <Switch
              checked={values.isPassive}
              name="isPassive"
              onChange={(e) => {
                onChange(e.target.name, e.target.checked);
              }}
              color="primary"
            />
          }
          label="Passive Mode"
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            await onSubmit({
              rootDomains:
                values.rootDomains === ''
                  ? []
                  : values.rootDomains
                      .split(',')
                      .map((domain) => domain.trim()),
              ipBlocks:
                values.ipBlocks === ''
                  ? []
                  : values.ipBlocks.split(',').map((ip) => ip.trim()),
              name: values.name,
              isPassive: values.isPassive,
              tags: chosenTags,
              parent: parent ? parent.id : undefined
            });
            if (!organization) setValues(defaultValues);
            setOpen(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
