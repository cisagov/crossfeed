import React from 'react';
import classes from './styles.module.scss';
import { Domain } from 'types';
import { Item } from './Item';

export const WebInfo: React.FC<{ domain: Domain }> = ({ domain }) => {
  let categoriesToProducts: { [name: string]: Set<string> } = {};
  for (const service of domain.services) {
    for (const product of service.products) {
      if (!product.tags || product.tags.length === 0) {
        product.tags.push('Misc');
      }
      const name =
        product.name + (product.version ? ` ${product.version}` : '');
      if (categoriesToProducts[product.tags[0]])
        categoriesToProducts[product.tags[0]].add(name);
      else categoriesToProducts[product.tags[0]] = new Set([name]);
    }
  }

  return (
    <div className={classes.root}>
      {Object.entries(categoriesToProducts).map(([name, products], index) => (
        <Item
          key={index}
          title={name}
          value={Array.from(products).join(', ')}
        ></Item>
      ))}
    </div>
  );
};
