// Web-compatible Alert polyfill for React Native
interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

const Alert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ): void {
    // For web, use native browser alert/confirm
    if (typeof window !== 'undefined') {
      if (buttons && buttons.length > 1) {
        // Use confirm for multiple buttons
        const confirmMessage = message ? `${title}\n\n${message}` : title;
        const result = window.confirm(confirmMessage);
        
        if (result && buttons[1]?.onPress) {
          buttons[1].onPress();
        } else if (!result && buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      } else {
        // Use alert for single button or no buttons
        const alertMessage = message ? `${title}\n\n${message}` : title;
        window.alert(alertMessage);
        
        if (buttons && buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      // Fallback for non-browser environments
      console.warn('Alert:', title, message);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  }
};

export default Alert;
