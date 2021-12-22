import React, {
  useEffect,
  useContext,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
  useMemo
} from 'react';
import { View, StyleSheet,Text,TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Share from 'react-native-share';
import { showMessage } from 'react-native-flash-message';
import {
  GenericTemplate,
  Price,
  ImageSlider,
  Button,
  HeaderButtons,
  ModalSelect,
  DateTimePicker
} from '../../common';
import Status from '../../magento/Status';
import { magento } from '../../magento';
import {
  NAVIGATION_TO_MEDIA_VIEWER,
  NAVIGATION_TO_ALERT_DIALOG,
  NAVIGATION_TO_CART_SCREEN,
} from '../../navigation/routes';
import { ThemeContext } from '../../theme';
import { translate } from '../../i18n';
import {
  SPACING,
  DIMENS,
  CUSTOM_ATTRIBUTES_SK,
  SIMPLE_TYPE_SK,
  URL_KEY_SK,
  CONFIGURABLE_TYPE_SK,
} from '../../constants';
import { getCustomerCart, getAttributeById } from '../../store/actions';
import {
  getPriceFromChildren,
  getValueFromAttribute,
  isAttributeAndValuePresent,
} from '../../utils/products';
import ProductDescription from './ProductDescription';
import { productType, isObject, isNonEmptyString } from '../../utils';
import ActionSheet from "react-native-actions-sheet";


const propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  attributes: PropTypes.object.isRequired,
  cartQuoteId: PropTypes.number.isRequired,
  currencySymbol: PropTypes.string.isRequired,
  currencyRate: PropTypes.number.isRequired,
  getCustomerCart: PropTypes.func.isRequired,
  getAttributeById: PropTypes.func.isRequired,
  /**
   * Whether current user is logged in or not
   */
  loggedIn: PropTypes.bool.isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      sku: PropTypes.string.isRequired,
      product: productType,
      children: PropTypes.arrayOf(
        PropTypes.shape({
          price: PropTypes.number,
        }),
      ),
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};

const defaultProps = {};

const ProductScreen = ({
  route: {
    params: { sku, product, children: _children },
  },
  loggedIn,
  attributes,
  cartQuoteId,
  currencySymbol,
  currencyRate,
  getAttributeById: _getAttributeById,
  getCustomerCart: refreshCustomerCart,
  navigation,
}) => {
  const [options, setOptions] = useState([]);
  const [children, setChildren] = useState(_children);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null); // In case of configurable
  const [media, setMedia] = useState([]);
  const [optionsApiStatus, setOptionsApiStatus] = useState(Status.DEFAULT);
  const [optionsApiErrorMessage, setOptionsApiErrorMessage] = useState('');
  const [addToCartStatus, setAddToCartStatus] = useState(Status.DEFAULT);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState({
    basePrice: product.price,
  });
  const [optionContainerYCord, setOptionContainerYCord] = useState(0);
  const [addToCartAvailable, setAddToCartAvailable] = useState(true); // In case something went wrong, set false
  const [productDeliveryDate, setProductDeliveryDate] = useState(new Date());
  const scrollViewRef = useRef();
  const { theme } = useContext(ThemeContext);
  // ref
  const bottomSheetRef = useRef();
  const actionSheetRef = useRef();
  let actionSheet;

  actionSheetRef.current?.snapToOffset(200);


  // variables
  const snapPoints = useMemo(() => ['25%', '50%'], []);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  useEffect(() => {
    if (product.type_id === CONFIGURABLE_TYPE_SK) {
      if (
        'extension_attributes' in product &&
        'configurable_product_options' in product.extension_attributes &&
        product.extension_attributes.configurable_product_options.length > 0
      ) {
        setOptions(
          [...product.extension_attributes.configurable_product_options].sort(
            (first, second) => first.position - second.position,
          ),
        );
        setOptionsApiStatus(Status.SUCCESS);
      } else {
        // Fetch the options manually
        setOptionsApiStatus(Status.LOADING);
        magento.admin
          .getConfigurableProductOptions(sku)
          .then(response => {
            setOptions(
              [...response].sort(
                (first, second) => first.position - second.position,
              ),
            );
            setOptionsApiStatus(Status.SUCCESS);
          })
          .catch(error => {
            setOptionsApiErrorMessage(
              error.message || translate('errors.genericError'),
            );
            setOptionsApiStatus(Status.ERROR);
            setAddToCartAvailable(false);
          });
      }
      if (!Array.isArray(children) || children.length < 1) {
        magento.admin
          .getConfigurableChildren(product.sku)
          .then(response => setChildren(response))
          .catch(error => console.log(error));
      }
    }
    setMedia(
      product?.media_gallery_entries.map(entry => ({
        source: {
          uri: `${magento.getProductMediaUrl()}${entry.file}`,
        },
      })),
    );
  }, []);

  useLayoutEffect(() => {
    const url = getValueFromAttribute(product, URL_KEY_SK);
    const completeUrl = `${magento.getBaseUrl()}${url}.html`;
    const title = translate('productScreen.shareTitle', {
      title: translate('common.brandName'),
    });
    const message = translate('productScreen.shareMessage', {
      productName: product.name,
      url: completeUrl,
      subTitle: translate('common.brandName'),
    });

    navigation.setOptions({
      headerRight: () => (
        <HeaderButtons>
          {isNonEmptyString(url) && (
            <HeaderButtons.Item
              title={translate('productScreen.menu.share')}
              iconName="share"
              onPress={() =>
                Share.open({
                  title,
                  message,
                }).catch(err => {
                  if ('message' in err) {
                    showMessage({
                      message: translate('common.error'),
                      description:
                        err.message || translate('errors.genericError'),
                      type: 'danger',
                    });
                  }
                  console.log(err);
                })
              }
            />
          )}
          <HeaderButtons.Item
            title={translate('productScreen.menu.cart')}
            iconName="shopping-cart"
            onPress={() =>
              loggedIn
                ? navigation.navigate(NAVIGATION_TO_CART_SCREEN)
                : showLoginPrompt()
            }
          />
        </HeaderButtons>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (
      product.type_id === CONFIGURABLE_TYPE_SK &&
      Array.isArray(children) &&
      children.length > 0
    ) {
      const priceObject = getPriceFromChildren(children);
      if (priceObject.starting === priceObject.ending) {
        setPrice({ basePrice: priceObject.starting });
      } else {
        setPrice({
          startingPrice: priceObject.starting,
          endingPrice: priceObject.ending,
        });
      }
    }
  }, [children]);

  useEffect(() => {
    if (optionsApiStatus === Status.SUCCESS) {
      options.forEach(
        option =>
          !attributes[option.attribute_id] &&
          _getAttributeById(option.attribute_id),
      );
    }
  }, [optionsApiStatus]);

  useEffect(() => {
    /**
     * Logic to extract particular product, based on user selected options
     * the selected product will be used to show price & thumbnail if available
     */
    if (
      product.type_id === CONFIGURABLE_TYPE_SK &&
      options.length !== 0 &&
      options.length === Object.keys(selectedOptions).length
    ) {
      const selectedOptionsWithNameAsKey = Object.keys(selectedOptions).reduce(
        (total, selectedOptionKey) => ({
          ...total,
          [attributes[selectedOptionKey].code]:
            selectedOptions[selectedOptionKey],
        }),
        {},
      );
      const _child = children.find(child =>
        Object.keys(selectedOptionsWithNameAsKey).every(attributeKey =>
          isAttributeAndValuePresent(
            child,
            attributeKey,
            selectedOptionsWithNameAsKey[attributeKey],
          ),
        ),
      );
      if (isObject(_child)) {
        setSelectedProduct(_child);
      }
    }
  }, [selectedOptions]);

  useEffect(() => {
    if (
      product.type_id === CONFIGURABLE_TYPE_SK &&
      isObject(selectedProduct) &&
      'price' in selectedProduct
    ) {
      setPrice({ basePrice: selectedProduct.price });
      const image = getValueFromAttribute(selectedProduct, 'image');
      if (isNonEmptyString(image)) {
        setMedia([
          { source: { uri: `${magento.getProductMediaUrl()}${image}` } },
          ...product?.media_gallery_entries.map(entry => ({
            source: {
              uri: `${magento.getProductMediaUrl()}${entry.file}`,
            },
          })),
        ]);
      }
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (addToCartStatus === Status.SUCCESS) {
      showMessage({
        message: translate('common.success'),
        description: translate('productScreen.addToCartSuccess'),
        type: 'success',
      });
      refreshCustomerCart();
    }
  }, [addToCartStatus]);

  const showLoginPrompt = description =>
    navigation.navigate(NAVIGATION_TO_ALERT_DIALOG, {
      description,
      loginMode: true,
    });

  const openMediaViewer = useCallback(
    index => {
      navigation.navigate(NAVIGATION_TO_MEDIA_VIEWER, {
        index,
        media,
      });
    },
    [navigation, media],
  );

  const onAddToCartClick = () => {
    if (!loggedIn) {
      showLoginPrompt(translate('productScreen.loginPromptMessage')); // Guest cart not iplemented
      return;
    }
    if (
      !(
        product.type_id === SIMPLE_TYPE_SK ||
        product.type_id === CONFIGURABLE_TYPE_SK
      )
    ) {
      showMessage({
        message: translate('common.attention'),
        description: translate('productScreen.unsupportedProductType', {
          productType: product.type_id,
        }),
        type: 'warning',
      });
      return;
    }
    if (
      product.type_id === CONFIGURABLE_TYPE_SK &&
      options.length !== Object.keys(selectedOptions).length
    ) {
      showMessage({
        message: translate('common.attention'),
        description: translate('productScreen.noOptionSelected'),
        type: 'warning',
      });
      if (scrollViewRef && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: 0,
          y: optionContainerYCord,
          animated: true,
        });
      }
      return;
    }
    setAddToCartStatus(Status.LOADING);
    const request = {
      cartItem: {
        sku,
        qty: quantity,
        quote_id: cartQuoteId
       
      },
    };
    if (product.type_id === CONFIGURABLE_TYPE_SK) {
      request.cartItem.extension_attributes = {};
      request.cartItem.options = [{
        "option_id": 5,
        "option_value": 52
      }];
      request.cartItem.product_option = {
        extension_attributes: {
          configurable_item_options: [{
            "option_id": 5,
            "option_value": 52
          }]
        },
      };
   }
    magento.customer
      .addItemToCart(request)
      .then(() => {
        setAddToCartStatus(Status.SUCCESS);
      })
      .catch(error => {
        showMessage({
          message: translate('common.error'),
          description: error.message || translate('errors.genericError'),
          type: 'danger',
        });
        setAddToCartStatus(Status.ERROR);
      });
  };

  return (
    <React.Fragment>
    <GenericTemplate
      assignRef={component => {
        scrollViewRef.current = component;
      }}
      scrollable
      footer={
        <Button
          style={styles.addToCart}
          disabled={!addToCartAvailable}
          loading={addToCartStatus === Status.LOADING}
          title={translate('productScreen.addToCartButton')}
          onPress={onAddToCartClick}
        />
      }
    >
      <ImageSlider
        media={media}
        resizeMode="contain"
        containerStyle={styles.imageContainer(theme)}
        height={DIMENS.productScreen.imageSliderHeight}
        onPress={openMediaViewer}
      />
      <View style={styles.priceContainer(theme)}>
        <Price
          basePriceStyle={styles.price}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          {...price}
        />
        {/* TODO: Add logic to increase quantity, but quantitiy should not increase over the stocks remaning */}
      </View>
      {product.type_id === CONFIGURABLE_TYPE_SK && (
        <GenericTemplate
          status={optionsApiStatus}
          errorMessage={optionsApiErrorMessage}
          style={styles.optionsContainer(theme)}
          onLayout={event => {
            const {
              nativeEvent: { layout },
            } = event;
            setOptionContainerYCord(layout.y);
          }}
        >
          {options.map((option, index) => (
            // TODO: Show label for valueIndex by fetching `/V1/products/attributes/${attributeId}` api
            <ModalSelect
              key={option.attribute_id}
              data={option.values.map(({ value_index: valueIndex }) => ({
                label:
                  option.attribute_id in attributes
                    ? attributes[option.attribute_id].options[valueIndex]
                    : String(valueIndex),
                key: valueIndex,
              }))}
              label={`${translate('common.select')} ${option.label}`}
              disabled={
                option.values.length === 0 || addToCartStatus === Status.LOADING
              }
              onChange={itemKey =>
                setSelectedOptions(prevState => ({
                  ...prevState,
                  [option.attribute_id]: itemKey,
                }))
              }
              style={index < options.length - 1 ? styles.optionContainer : {}}
            />
          ))}
        </GenericTemplate>
      )}
      <DateTimePicker
          mode="date"
         label="Select Delivery Date"
          onChange={(itemValue)=> {
           
          }}
          //maximumDate={CURRENT_DATE}
        //  disabled={apiStatus === Status.LOADING}
        />
      <ProductDescription customAttributes={product[CUSTOM_ATTRIBUTES_SK]} />
     
    </GenericTemplate>
     <View
     style={{
       justifyContent: "center",
       flex: 1,
       position:'absolute',
       height:'100%',
       width:'100%',
     }}
   >
     <TouchableOpacity
       onPress={() => {
        actionSheetRef.current?.snapToOffset(800);

         actionSheetRef.current?.setModalVisible();
       }}
     >
       <Text>Open ActionSheet</Text>
     </TouchableOpacity>

     <ActionSheet ref={actionSheetRef}>
       <View style={{height:'60%'}}>
         <Text>YOUR CUSTOM COMPONENT INSIDE THE ACTIONSHEET</Text>
       </View>
     </ActionSheet>
   </View>
   </React.Fragment>

  );
};

const styles = StyleSheet.create({
  addToCart: {
    borderRadius: 0,
  },
  imageContainer: theme => ({
    backgroundColor: theme.colors.surface,
    marginBottom: SPACING.large,
  }),
  priceContainer: theme => ({
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: SPACING.large,
    marginBottom: SPACING.large,
  }),
  optionsContainer: theme => ({
    backgroundColor: theme.colors.surface,
    padding: SPACING.large,
    marginBottom: SPACING.large,
  }),
  optionContainer: {
    marginBottom: SPACING.large,
  },
  price: {
    fontSize: DIMENS.productScreen.priceFontSize,
  },
});

ProductScreen.propTypes = propTypes;

ProductScreen.defaultProps = defaultProps;

const mapStateToProps = ({
  magento: magentoReducer,
  cart,
  product,
  account,
}) => {
  const {
    currency: {
      displayCurrencySymbol: currencySymbol,
      displayCurrencyExchangeRate: currencyRate,
    },
  } = magentoReducer;
  const { cart: { id: cartQuoteId } = {} } = cart;
  const { attributes } = product;
  const { loggedIn } = account;
  return {
    loggedIn,
    attributes,
    cartQuoteId,
    currencySymbol,
    currencyRate,
  };
};

export default connect(mapStateToProps, { getCustomerCart, getAttributeById })(
  ProductScreen,
);
