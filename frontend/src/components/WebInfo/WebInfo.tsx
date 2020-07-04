import React from 'react';
import classes from './styles.module.scss';
import { WebInfo as WebInfoType, Technology } from 'types';
import { Item } from './Item';

export const WebInfo: React.FC<WebInfoType> = props => {
  let categoriesToTechnologies: { [name: string]: Technology[] } = {};
  for (let technology of props.technologies) {
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
