import React from 'react';
import { useSelector } from 'react-redux';
import { CATEGORY_TREE } from '../../../reducers/types';
import { GenericTemplate, CategoryTree } from '../../../components';

const CategoryTreeContainer = () => {
  const {
    status,
    errorMessage,
    children_data: categories
  } = useSelector(state => state[CATEGORY_TREE]);

  const renderChildren = () => {
    if (categories) {
      return <CategoryTree categories={categories} />;
    }
    return <></>;
  };

  return (
    <GenericTemplate
      isScrollable={false}
      status={status}
      errorMessage={errorMessage}
    >
      {renderChildren()}
    </GenericTemplate>
  );
};

CategoryTreeContainer.propTypes = {};

CategoryTreeContainer.defaultPorps = {};

export default CategoryTreeContainer;
