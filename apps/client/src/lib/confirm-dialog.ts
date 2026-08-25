import { Modal } from '@ant-design/react-native';

/** 统一确认弹窗：使用 Ant Design React Native 的 Modal.alert。 */
export function confirmDialog(
  title: string,
  message: string,
  confirmLabel = '确定',
): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.alert(title, message, [
      { text: '取消', onPress: () => resolve(false) },
      { text: confirmLabel, style: { color: '#FF483C', fontWeight: '800' }, onPress: () => resolve(true) },
    ]);
  });
}
