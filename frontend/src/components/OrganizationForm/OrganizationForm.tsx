import React, { useCallback, useEffect, useState } from 'react';
import * as orgFormStyles from './orgFormStyle';
import { Organization, OrganizationTag } from 'types';
import {
  Autocomplete,
  Button,
  Chip,
  createFilterOptions,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Grid,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { STATE_OPTIONS } from '../../constants/constants';
import { useAuthContext } from 'context';

const classes = orgFormStyles.classes;
const StyledDialog = orgFormStyles.StyledDialog;

interface AutocompleteType extends Partial<OrganizationTag> {
  title?: string;
}

export interface OrganizationFormValues {
  name: string;
  rootDomains: string;
  ipBlocks: string;
  isPassive: boolean;
  tags: OrganizationTag[];
  stateName?: string | null | undefined;
  acronym?: string | null;
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
    tags: [],
    stateName: organization ? organization.stateName : '',
    acronym: organization ? organization.acronym : ''
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
  const handleStateChange = (event: SelectChangeEvent<string | null>) => {
    setValues((values) => ({
      ...values,
      [event.target.name]: event.target.value
    }));
  };

  const textFieldStyling = {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderRadius: '0px'
      }
    }
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
        Create New {parent ? 'Team' : 'Organization'}
      </DialogTitle>
      <DialogContent>
        Organization Name
        <TextField
          sx={textFieldStyling}
          placeholder="Enter the Organization's Name"
          size="small"
          margin="dense"
          id="name"
          inputProps={{ maxLength: 250 }}
          name="name"
          type="text"
          fullWidth
          value={values.name}
          onChange={onTextChange}
        />
        Organization Acronym
        <TextField
          sx={textFieldStyling}
          placeholder="Enter a unique Acronym for the Organization"
          size="small"
          margin="dense"
          id="acronym"
          inputProps={{ maxLength: 250 }}
          name="acronym"
          type="text"
          fullWidth
          value={values.acronym}
          onChange={onTextChange}
        />
        Root Domains
        <TextField
          sx={textFieldStyling}
          placeholder="Enter Root Domains"
          size="small"
          margin="dense"
          id="rootDomains"
          name="rootDomains"
          type="text"
          fullWidth
          value={values.rootDomains}
          onChange={onTextChange}
        />
        IP Blocks
        <TextField
          sx={textFieldStyling}
          placeholder="Enter IP Blocks"
          size="small"
          margin="dense"
          id="ipBlocks"
          name="ipBlocks"
          type="text"
          fullWidth
          value={values.ipBlocks}
          onChange={onTextChange}
        />
        Organization State
        <Select
          sx={{ mt: 1 }}
          displayEmpty
          size="small"
          id="stateName"
          value={values.stateName}
          name="stateName"
          onChange={handleStateChange}
          fullWidth
          renderValue={
            values.stateName !== ''
              ? undefined
              : () => <Typography color="#bdbdbd">Select your State</Typography>
          }
        >
          {STATE_OPTIONS.map((stateName: string, index: number) => (
            <MenuItem key={index} value={stateName}>
              {stateName}
            </MenuItem>
          ))}
        </Select>
        {/* TODO: Fix Tag selection issues. */}
        <Typography mt={1}>Tags</Typography>
        <Typography variant="caption">
          Select an existing tag or add a new one.
        </Typography>
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
              stateName: values.stateName,
              isPassive: values.isPassive,
              tags: chosenTags,
              acronym: values.acronym,
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
