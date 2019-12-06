import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { View, ColorPropType } from 'react-native';
import Spinner from '../../atoms/Spinner';
import { ThemeContext } from '../../../theme';

const LoadingView = ({
  /**
   * size of the spinner in LoadingView, can be
   * 1. 'large'
   * 2. 'small'
   */
  size,
  /**
   * background that will appear behind spinner,
   * by default: transparent
   */
  backgroundColor
}) => {
  const theme = useContext(ThemeContext);
  return (
    <View style={styles.container(backgroundColor, theme)}>
      <Spinner size={size} />
    </View>
  );
};

const styles = {
  container: (backgroundColor, theme) => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: !backgroundColor ? theme.colors.transparent : backgroundColor,
  }),
};

LoadingView.propTypes = {
  size: PropTypes.string,
  backgroundColor: ColorPropType,
};

LoadingView.defaultProps = {
  size: 'large',
  backgroundColor: null,
};

export default LoadingView;
