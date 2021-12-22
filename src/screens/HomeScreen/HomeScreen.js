import React, { useMemo } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { GenericTemplate, Card, Text, ImageSlider,ProductListItem } from '../../common';
import { magento } from '../../magento';
import FeaturedCategoryList from './FeaturedCategoryList';
import Status from '../../magento/Status';
import { DIMENS, SPACING } from '../../constants';
import { useState } from 'react';
import { useEffect } from 'react';

const propTypes = {
  /**
   * Tells about the status of the fetch cmsBlockData api call
   * cmsBlockData contains the data need to be shown in HomeScreen
   *
   * if status === Status.DEFAULT => api hasn't been hit yet
   * if status === Status.LOADING => api is currently being executed
   * if status === Status.SUCCESS => success response from api
   * if status === Status.ERROR   => error response from api or error
   *                                 in initMagento generator function in appSagas.js
   *
   * @source redux
   */
  status: PropTypes.oneOf(Object.values(Status)).isRequired,
  /**
   * error message if status === Status.ERROR
   *
   * @source redux
   */
  errorMessage: PropTypes.string,
  slider: PropTypes.arrayOf(
    PropTypes.shape({ image: PropTypes.string.isRequired }),
  ),
  // eslint-disable-next-line react/forbid-prop-types
  featuredCategories: PropTypes.object,
};

const defaultProps = {
  slider: [],
  featuredCategories: {},
  errorMessage: '',
};

const columnCount = 2;

const HomeScreen = ({ status, errorMessage, slider, featuredCategories }) => {

  const [products,setProducts] = useState([]);

  const media = useMemo(
    () =>
      slider.map(slide => ({
        source: { uri: `${magento.getMediaUrl()}${slide.image}` },
      })),
    [slider],
  );

  useEffect(()=>{
    fetchProducts();
  },[])

  const fetchProducts = ()=>{
    magento.admin.getAllProducts().then(response=>{
      setProducts(response.items);
    })
  }

  const renderRow = ({ item }) => (
    <ProductListItem
      columnCount={columnCount}
      product={item}
      currencySymbol="$"
      currencyRate={1}
    />
  );

  return (
    <React.Fragment>
      <FlatList
        numColumns={columnCount}
        data={products}
        renderItem={renderRow}/>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  imageSliderContainer: {
    height: DIMENS.homeScreen.sliderHeight,
  },
  card: {
    borderRadius: 0,
    marginTop: SPACING.large,
  },
  title: {
    marginTop: SPACING.small,
    marginLeft: SPACING.medium,
  },
});

HomeScreen.propTypes = propTypes;

HomeScreen.defaultProps = defaultProps;

const mapStatetoProps = ({ home }) => {
  const { status, errorMessage, slider, featuredCategories } = home;
  return {
    status,
    slider,
    errorMessage,
    featuredCategories,
  };
};

export default connect(mapStatetoProps)(HomeScreen);
