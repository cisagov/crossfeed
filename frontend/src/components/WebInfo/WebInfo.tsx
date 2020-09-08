import React from 'react';
import classes from './styles.module.scss';
import { Domain, Product } from 'types';
import { Item } from './Item';

export const WebInfo: React.FC<{ domain: Domain }> = ({ domain }) => {
  let categoriesToProducts: { [name: string]: Product[] } = {};
  for (const service of domain.services) {
    for (const product of service.products) {
      if (product.tags.length === 0) {
        product.tags.push('Misc');
      }
      for (const tag of product.tags) {
        if (categoriesToProducts[tag]) categoriesToProducts[tag].push(product);
        else categoriesToProducts[tag] = [product];
      }
    }
  }

  return (
    <div className={classes.root}>
      {Object.entries(categoriesToProducts).map(([name, products], index) => (
        <Item
          key={index}
          title={name}
          value={products
            .map(
              product =>
                product.name + (product.version ? ` ${product.version}` : '')
            )
            .join(', ')}
        ></Item>
      ))}
    </div>
  );
};
