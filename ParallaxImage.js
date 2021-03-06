/**
 * @providesModule ParallaxImage
 */
'use strict';

var isEqual = require('lodash/lang/isEqual');
var React = require('react');
var {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableHighlight,
  TouchableWithoutFeedback,
} = require('react-native');

var WINDOW_HEIGHT = Dimensions.get('window').height;

var ParallaxImage = React.createClass({
  propTypes: {
    onPress:              React.PropTypes.func,
    scrollY:              React.PropTypes.object,
    preParallaxTransform: React.PropTypes.array,
    parallaxFactor:       React.PropTypes.number,
    imageStyle:           Image.propTypes.style,
    overlayStyle:         View.propTypes.style,
    touchebleStyle:       View.propTypes.style,
    touchActiveOpacity:   React.PropTypes.number,
    touchUnderlayColor:   React.PropTypes.string,
    parallaxedContent:    React.PropTypes.func,
  },

  getDefaultProps: function() {
    return {
      parallaxFactor: 0.2,
    };
  },

  getInitialState: function() {
    this.isLayoutStale = true;
    return {
      offset: 0,
      height: 0,
      width:  0,
    };
  },

  setNativeProps: function(nativeProps) {
    this._container.setNativeProps(nativeProps);
  },

  // Measure again since onLayout event won't pass the offset
  handleLayout: function(event) {
    //if(this.isLayoutStale) {
      (this._touchable || this._container).measure(this.handleMeasure);
    //}
  },

  componentWillReceiveProps: function(nextProps) {
    if(!isEqual(nextProps, this.props)) {
      this.isLayoutStale = true;
    }
  },

  handleMeasure: function(ox, oy, width, height, px, py) {
    this.isLayoutStale = false;
    this.setState({
      offset: py,
      height,
      width,
    });
  },

  render: function() {
    var { offset, width, height } = this.state;
    var {
      onPress,
      scrollY,
      preParallaxTransform,
      parallaxFactor,
      style,
      imageStyle,
      overlayStyle,
      touchebleStyle,
      children,
      touchActiveOpacity,
      touchUnderlayColor,
      ...props
    } = this.props;
    var parallaxPadding = height * parallaxFactor;

    var parallaxStyle = {
      marginTop: parallaxPadding * 0.5,
      height: height + parallaxPadding,
      width: width,
    };

    if (scrollY) {
      parallaxStyle.transform = [
        {
          translateY: scrollY.interpolate({
            inputRange:   [offset - height, offset + WINDOW_HEIGHT + height],
            outputRange:  [-parallaxPadding, parallaxPadding],
            //extrapolate:  'clamp',
          }),
        },
      ];
    } else {
      parallaxStyle.transform = [
        { translateY: -parallaxPadding },
      ];
    }

    if (preParallaxTransform) {
        parallaxStyle.transform = [
            ...preParallaxTransform,
            ...parallaxStyle.transform
        ]
    }

    // skewY: "0.001deg" need to avoid border aliasing when we use TouchableHighlight
    // with transformation (https://github.com/facebook/react-native/issues/11911)
    let actualStyle = onPress ? { transform: [{ skewY: "0.001deg" }] } : style;

    let parallaxedContent;
    if (this.props.parallaxedContent) {
        var parallaxProps = {
            ...props,
            style: [imageStyle, parallaxStyle],
            pointerEvents: "none"
        };

        delete parallaxProps.parallaxedContent;
        parallaxedContent = React.cloneElement(this.props.parallaxedContent(), parallaxProps);
    } else {
        parallaxedContent = (
            <Animated.Image
                {...props}
                style={[imageStyle, parallaxStyle]}
                pointerEvents="none"
            />
        );
    }

    /*
    <Animated.Image
      {...props}
      style={[imageStyle, parallaxStyle]}
      pointerEvents="none"
    />
    */

    var content = (
      <View
        ref={component => this._container = component}
        style={[actualStyle, styles.container]}
        onLayout={this.handleLayout}
      >
        {parallaxedContent}
        <View style={[styles.overlay, overlayStyle]}>
          {children}
        </View>
      </View>
    );

    // Since we can't allow nested Parallax.Images, we supply this shorthand to wrap a touchable
    // around the element
    if (onPress) {
      return (
        <TouchableHighlight
            style={[style, touchebleStyle]}
            activeOpacity={touchActiveOpacity}
            underlayColor={touchUnderlayColor}
            ref={component => this._touchable = component}
            onPress={onPress}
        >
          {content}
        </TouchableHighlight>
      );
    }

    return content;
  }
});

var styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

module.exports = ParallaxImage;
