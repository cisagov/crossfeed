import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import { Button, Label, Form } from '@trussworks/react-uswds';
import { Domain } from 'types';
import { useAuthContext } from 'context';
import Fuse from 'fuse.js';

interface ApiResponse {
  result: Partial<Domain>[];
  count: number;
}

interface Suggestion {
  id: string;
  name: string;
  __matches: { indices: number[][]; key: string; value: string }[];
}

export default ({
  onSubmit,
  onSelect
}: {
  onSubmit: (e: string) => void;
  onSelect: (e: { id: string; value: string }) => void;
}) => {
  const { apiGet } = useAuthContext();
  const [fuse, setFuse] = useState<any>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [query, setQuery] = useState('');
  const label = 'Search';
  const inputId = 'search';
  const inputName = 'search';

  useEffect(() => {
    (async () => {
      const { result } = await apiGet<ApiResponse>('/domain/suggest');
      const options = {
        keys: ['name'],
        includeMatches: true
      };
      setFuse(new Fuse(result, options));
    })();
  }, []);

  const renderSuggestion = (suggestion: Suggestion) => {
    let indices = suggestion.__matches
      .filter(e => e.key === 'name')
      .map(e => e.indices.flat());
    let isBold = (index: number) => {
      for (let [start, end] of indices) {
        if (index >= start && index <= end) {
          return true;
        }
      }
      return false;
    };
    return (
      <div>
        {suggestion.name
          .split('')
          .map((character, index) =>
            isBold(index) ? (
              <strong key={suggestion.name + index}>{character}</strong>
            ) : (
              <span key={suggestion.name + index}>{character}</span>
            )
          )}
      </div>
    );
  };

  return (
    <Form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(query);
      }}
      className={'usa-search cisa-crossfeed-search'}
      role="search"
      search={true}
    >
      <Label srOnly={true} htmlFor={inputId}>
        {label}
      </Label>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={({ value }) => {
          setSuggestions(
            fuse.search(value, { limit: 10 }).map((e: any) => ({
              ...e.item,
              __matches: e.matches
            }))
          );
        }}
        onSuggestionsClearRequested={() => setSuggestions([])}
        getSuggestionValue={(suggestion: any) => suggestion}
        renderSuggestion={renderSuggestion}
        inputProps={{
          placeholder: 'Search for domains...',
          value: query,
          name: inputName,
          id: inputId,
          onChange: (e, { newValue }) => {
            if ((newValue as any).id) {
              // selected an option
              onSelect(newValue as any);
            } else {
              setQuery(newValue);
            }
          }
        }}
      />
      <Button type="submit">
        <span className={'usa-search__submit-text'}>Search</span>
      </Button>
    </Form>
  );
};
