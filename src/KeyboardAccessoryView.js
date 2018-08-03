import React, {Component} from 'react';
import {StyleSheet, Platform, Dimensions, NativeModules, NativeEventEmitter, DeviceEventEmitter, processColor, BackHandler} from 'react-native';
import {KeyboardTrackingView} from 'react-native-keyboard-tracking-view';
import CustomKeyboardView from './CustomKeyboardView';
import KeyboardUtils from './utils/KeyboardUtils';

const IsIOS = Platform.OS === 'ios';
const IsAndroid = Platform.OS === 'android';
const ScreenSize = Dimensions.get('window');

export default class KeyboardAccessoryView extends Component {
  // static propTypes = {
  //   renderContent: PropTypes.func,
  //   onHeightChanged: React.PropTypes.func,
  //   kbInputRef: React.PropTypes.object,
  //   kbComponent: React.PropTypes.string,
  //   kbInitialProps: React.PropTypes.object,
  //   onItemSelected: React.PropTypes.func,
  //   onRequestShowKeyboard: React.PropTypes.func,
  //   onKeyboardResigned: React.PropTypes.func,
  //   iOSScrollBehavior: React.PropTypes.number,
  //   revealKeyboardInteractive: React.PropTypes.bool,
  //   manageScrollView: React.PropTypes.bool,
  //   requiresSameParentToManageScrollView: React.PropTypes.bool,
  // };
  static defaultProps = {
    iOSScrollBehavior: -1,
    revealKeyboardInteractive: false,
    manageScrollView: true,
    requiresSameParentToManageScrollView: false,
  };

  constructor(props) {
    super(props);

    this.onContainerComponentHeightChanged = this.onContainerComponentHeightChanged.bind(this);
    this.processInitialProps = this.processInitialProps.bind(this);
    this.registerForKeyboardResignedEvent = this.registerForKeyboardResignedEvent.bind(this);
    this.registerAndroidBackHandler = this.registerAndroidBackHandler.bind(this);
    this.onAndroidBackPressed = this.onAndroidBackPressed.bind(this);

    this.registerForKeyboardResignedEvent();
    this.registerAndroidBackHandler();
  }

  componentWillUnmount() {
    if (this.customInputControllerEventsSubscriber) {
      this.customInputControllerEventsSubscriber.remove();
    }
    if (IsAndroid) {
      BackHandler.removeEventListener('hardwareBackPress', this.onAndroidBackPressed);
    }
  }

  onContainerComponentHeightChanged(event) {
    if (this.props.onHeightChanged) {
      this.props.onHeightChanged(event.nativeEvent.layout.height);
    }
  }

  getIOSTrackingScrollBehavior() {
    let scrollBehavior = this.props.iOSScrollBehavior;
    if (IsIOS && NativeModules.KeyboardTrackingViewManager && scrollBehavior === -1) {
      scrollBehavior = NativeModules.KeyboardTrackingViewManager.KeyboardTrackingScrollBehaviorFixedOffset;
    }
    return scrollBehavior;
  }

  registerForKeyboardResignedEvent() {
    let eventEmitter = null;
    if (IsIOS) {
      if (NativeModules.CustomInputController) {
        eventEmitter = new NativeEventEmitter(NativeModules.CustomInputController);
      }
    } else {
      eventEmitter = DeviceEventEmitter;
    }

    if (eventEmitter !== null) {
      this.customInputControllerEventsSubscriber = eventEmitter.addListener('kbdResigned', () => {
        if (this.props.onKeyboardResigned) {
          this.props.onKeyboardResigned();
        }
      });
    }
  }

  registerAndroidBackHandler() {
    if (IsAndroid) {
      BackHandler.addEventListener('hardwareBackPress', this.onAndroidBackPressed);
    }
  }

  onAndroidBackPressed() {
    if (this.props.kbComponent) {
      KeyboardUtils.dismiss();
      return true;
    }
    return false;
  }

  processInitialProps() {
    if (IsIOS && this.props.kbInitialProps && this.props.kbInitialProps.backgroundColor) {
      const processedProps = Object.assign({}, this.props.kbInitialProps);
      processedProps.backgroundColor = processColor(processedProps.backgroundColor);
      return processedProps;
    }
    return this.props.kbInitialProps;
  }

  render() {
    return (
      <KeyboardTrackingView
        style={styles.trackingToolbarContainer}
        onLayout={this.onContainerComponentHeightChanged}
        scrollBehavior={this.getIOSTrackingScrollBehavior()}
        revealKeyboardInteractive={this.props.revealKeyboardInteractive}
        manageScrollView={this.props.manageScrollView}
        requiresSameParentToManageScrollView={this.props.requiresSameParentToManageScrollView}
      >
        {this.props.renderContent && this.props.renderContent()}
        <CustomKeyboardView
          inputRef={this.props.kbInputRef}
          component={this.props.kbComponent}
          initialProps={this.processInitialProps()}
          onItemSelected={this.props.onItemSelected}
          onRequestShowKeyboard={this.props.onRequestShowKeyboard}
        />
      </KeyboardTrackingView>
    );
  }
}

const styles = StyleSheet.create({
  trackingToolbarContainer: {
    ...Platform.select({
      ios: {
        width: ScreenSize.width,
        position: 'absolute',
        bottom: 0,
        left: 0,
      },
    }),
  },
});
