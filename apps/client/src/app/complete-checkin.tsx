import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppShell } from '@/components/app-shell';
import { BackImageButton } from '@/components/back-image-button';
import { useApp } from '@/contexts/app-context';
import { useLayoutInsets } from '@/hooks/use-layout-insets';
import { palette, spacing } from '@/theme';
import { submitTodoCompletion, uploadCompletionAttachment } from '@/services/api';
import type { CompletionAttachmentInput } from '@/types';

const NOTICE_ICON = require('../../assets/images/checkin-notice-icon.png');
const CAMERA_ILLUSTRATION = require('../../assets/images/checkin-camera-illustration.png');

type CompletionAttachment = CompletionAttachmentInput & {
  localUri: string;
};

export default function CompleteCheckinScreen() {
  const params = useLocalSearchParams<{ todoId?: string }>();
  const rawTodoId = Array.isArray(params.todoId) ? params.todoId[0] : params.todoId;
  const todoId = Number.parseInt(rawTodoId ?? '', 10);
  const hasValidTodoId = Number.isInteger(todoId) && todoId > 0;

  const router = useRouter();
  const { user } = useApp();
  const insets = useLayoutInsets();
  const [feelingText, setFeelingText] = useState('');
  const [attachments, setAttachments] = useState<CompletionAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    hasValidTodoId &&
    !submitting &&
    !uploading &&
    feelingText.trim().length > 0;
  const attachmentTitle = useMemo(
    () => (attachments.length > 0 ? '已添加照片' : '可选：添加一张现场照片'),
    [attachments.length],
  );

  const handleUpload = async () => {
    if (!hasValidTodoId || !user) return;
    if (attachments.length >= 6) {
      setError('最多可上传 6 张完成凭证');
      return;
    }

    if (Platform.OS !== 'web') {
      const status = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!status.granted) {
        Alert.alert('无法上传', '请先允许应用访问相册');
        return;
      }
    }

    setUploading(true);
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64 || !asset.uri) {
        throw new Error('未获取到文件内容');
      }

      const uploaded = await uploadCompletionAttachment({
        todoId,
        mediaBase64: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
        localUri: asset.uri,
      });

      setAttachments((current) => [
        ...current,
        {
          localUri: asset.uri,
          objectKey: uploaded.objectKey,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
        },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '上传完成凭证失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (objectKey: string) => {
    setAttachments((current) => current.filter((item) => item.objectKey !== objectKey));
  };

  const handleSubmit = async () => {
    if (!hasValidTodoId || !user || !canSubmit) {
      if (!hasValidTodoId) {
        setError('请从本周约定进入完成页');
      } else if (!feelingText.trim()) {
        setError('请先填写真实感受');
      }
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitTodoCompletion({
        todoId,
        feelingText: feelingText.trim(),
        visibility: 'private',
        attachments: attachments.map(({ objectKey, mimeType, sizeBytes }) => ({
          objectKey,
          mimeType,
          sizeBytes,
        })),
      });
      router.replace('/todos');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '完成回传失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/todos');
    }
  };

  return (
    <AppShell>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 118 }]}>
          <View style={styles.header}>
            <BackImageButton onPress={handleBack} style={styles.backButton} />
            <Text style={styles.headerTitle}>完成回传</Text>
          </View>

          <View style={styles.notice}>
            <Image resizeMode="contain" source={NOTICE_ICON} style={styles.noticeIcon} />
            <Text style={styles.noticeText}>留下一句真实感受，帮助下次推荐更准确</Text>
          </View>

          <Text style={styles.sectionTitle}>现场照片（可选）</Text>
          <Pressable accessibilityRole="button" onPress={handleUpload} style={styles.uploadCard}>
            <Image resizeMode="contain" source={CAMERA_ILLUSTRATION} style={styles.cameraImage} />
            <Text style={styles.uploadText}>{attachmentTitle}</Text>
          </Pressable>
          {attachments.length > 0 ? (
            <View style={styles.attachmentList}>
              {attachments.map((item) => (
                <View key={`${item.objectKey}`} style={styles.attachmentItem}>
                  <Image source={{ uri: item.localUri }} style={styles.attachmentThumb} />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleRemoveAttachment(item.objectKey)}
                    style={styles.removeAttachmentButton}>
                    <Text style={styles.removeAttachmentText}>x</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>这次行程感受如何?</Text>
          <TextInput
            value={feelingText}
            onChangeText={setFeelingText}
            multiline
            placeholder="例如:今天真的安静了20分钟，风很大，咖啡比想象中更好喝。"
            placeholderTextColor="#AAA5C8"
            maxLength={500}
            style={styles.feelingInput}
            textAlignVertical="top"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={[styles.fixedBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit || uploading || submitting}
            onPress={handleSubmit}
            style={[styles.submitButton, (!canSubmit || uploading || submitting) && styles.submitButtonDisabled]}>
            <Text style={styles.submitText}>{submitting ? '提交中…' : '完成打卡'}</Text>
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F0EBFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  header: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 2,
  },
  headerTitle: {
    color: '#05030B',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  notice: {
    marginTop: 12,
    minHeight: 33,
    borderRadius: 18,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  noticeIcon: {
    width: 16,
    height: 16,
  },
  noticeText: {
    flex: 1,
    minWidth: 0,
    color: '#070513',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 9,
    color: '#05030B',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  uploadCard: {
    height: 188,
    borderRadius: 16,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraImage: {
    width: 126,
    height: 128,
  },
  uploadText: {
    marginTop: 2,
    color: '#05030B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  attachmentList: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentItem: {
    position: 'relative',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF5D5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAttachmentText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '900',
  },
  attachmentThumb: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#E7E0FF',
  },
  feelingInput: {
    height: 99,
    borderRadius: 16,
    backgroundColor: palette.white,
    paddingHorizontal: 18,
    paddingTop: 18,
    color: palette.ink,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    outlineStyle: 'none' as never,
  },
  syncCard: {
    marginTop: 26,
    borderRadius: 18,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingTop: 19,
    paddingBottom: 20,
  },
  syncTitle: {
    color: '#05030B',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  syncBody: {
    marginTop: 13,
    color: '#8C86AA',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  syncActions: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 22,
    backgroundColor: '#F2EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSyncButton: {
    backgroundColor: '#E8DFFF',
  },
  secondaryText: {
    color: palette.primaryDark,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  primarySmallButton: {
    flex: 1,
    height: 42,
    borderRadius: 22,
    backgroundColor: palette.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPrimarySyncButton: {
    opacity: 0.95,
    borderWidth: 1,
    borderColor: '#4A3ED7',
  },
  primarySmallText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  fixedBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F0EBFF',
  },
  submitButton: {
    height: 52,
    borderRadius: 27,
    backgroundColor: palette.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 12px 30px rgba(92, 77, 224, 0.24)' },
      default: {
        shadowColor: palette.primaryDark,
        shadowOpacity: 0.24,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: palette.white,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 14,
    color: '#CE4A4A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
