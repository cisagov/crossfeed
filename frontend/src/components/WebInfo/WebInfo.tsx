import React from 'react';
import classes from './styles.module.scss';
import { Technology } from 'types';
import { Item } from './Item';

export const WebInfo: React.FC<{ webTechnologies: Technology[] }> = ({
  webTechnologies
}) => {
  let categoriesToTechnologies: { [name: string]: Technology[] } = {};
  for (let technology of webTechnologies) {
    for (let cat of technology.categories) {
      if (categoriesToTechnologies[cat.name])
        categoriesToTechnologies[cat.name].push(technology);
      else categoriesToTechnologies[cat.name] = [technology];
    }
  }

  return (
    <div className={classes.root}>
      {Object.entries(categoriesToTechnologies).map(
        ([name, technologies], index) => (
          <Item
            key={index}
            title={name}
            value={technologies.map(technology => technology.name).join(', ')}
          ></Item>
        )
      )}
    </div>
  );
};
