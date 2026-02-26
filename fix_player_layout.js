const fs = require('fs');

const path = 'components/GlobalPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fixing miniPlayerStyle - ensure height: MINI_PLAYER_HEIGHT
content = content.replace(
    /const miniPlayerStyle = useAnimatedStyle\(\(\) => \(\{[\s\S]*?\}\)\);/m,
    `const miniPlayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expansion.value, [0, 0.15], [1, 0], Extrapolation.CLAMP),
    pointerEvents: expansion.value < 0.1 ? 'auto' : 'none',
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: MINI_PLAYER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  }));`
);

// 2. Fixing containerStyle
// Ensure background is transparent and it doesn't block hits when collapsed
content = content.replace(
    /backgroundColor: `rgba\(10, 10, 15, \$\{interpolate\(expansion\.value, \[0, 1\], \[0\.8, 1\], Extrapolation\.CLAMP\)\)\}`,/,
    "backgroundColor: 'transparent',"
);

// Ensure it covers full screen when expanded but is box-none when collapsed
content = content.replace(
    /return \{([\s\S]*?)position: 'absolute',/,
    (match, inner) => {
        return `return {${inner}position: 'absolute', pointerEvents: expansion.value > 0.5 ? 'auto' : 'box-none',`;
    }
);

// 3. Render structure: move background logic away from covering the whole box
// We want the background to move WITH the expansion.

// Find the return statement start
const returnMatch = content.match(/return \(\s*<Animated\.View style=\{containerStyle\}>([\s\S]*?)<\/Animated\.View >\s*\);/);
if (returnMatch) {
    let returnBody = returnMatch[1];

    // Remove the top-level BlurView that fills the entire container
    returnBody = returnBody.replace(
        /<BlurView\s+intensity=\{80\}\s+tint="dark"\s+style=\{StyleSheet\.absoluteFill\}\s*\/>/,
        ''
    );

    // Ensure the main and mini backgrounds are correct
    // (Already updated some via other replacements, but let's be thorough)

    // The background for full player should be inside the [opacity: expansion] block
    // (Existing code might have this already if I didn't break it)

    content = content.replace(returnMatch[0],
        `return (
    <Animated.View style={containerStyle}>
      {/* Background for full player */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: expansion, backgroundColor: '#0A0A0F' }]}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle]}>
          {validArtwork && <Image source={{ uri: currentTrack.artwork }} style={StyleSheet.absoluteFill} contentFit="cover" />}
          {validArtwork && <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill} />}
          <LinearGradient colors={[bgColor, 'transparent', '#0A0A0F']} locations={[0, 0.4, 1]} style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} />
        </Animated.View>
      </Animated.View>

      {/* MINI PLAYER BAR */}
      <Animated.View style={miniPlayerStyle}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,20,30,0.6)' }]} />
        <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={expand}>
          <View style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {validArtwork ? (
              <AnimatedImage source={{ uri: currentTrack.artwork }} style={{ width: 40, height: 40 }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="musical-note" size={16} color={Colors.primary} /></View>
            )}
          </View>
          <View style={{ marginLeft: 12, flex: 1, paddingRight: 10 }}>
            <Text style={{ color: Colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 }} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BouncyButton onPress={handlePlayPause} hitSlop={12}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={Colors.text} />
          </BouncyButton>
          <BouncyButton onPress={handleSkipNext} hitSlop={12}>
            <Ionicons name="play-forward" size={22} color={Colors.text} />
          </BouncyButton>
        </View>

        <View style={{ position: 'absolute', bottom: -1, left: 16, right: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
          <View style={{ height: 2, backgroundColor: Colors.text, borderRadius: 1, width: \`\${progress * 100}%\` }} />
        </View>
      </Animated.View>

      <Animated.View style={fullPlayerStyle} {...swipeDownResponder.panHandlers}>
        <View style={{ height: 4, width: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginTop: 8 }} />
        <View style={styles.topBar}>
          <Pressable onPress={() => collapse()} hitSlop={12} style={styles.topBarIconLeft}>
            <Ionicons name="chevron-down" size={28} color={Colors.text} />
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>NOW PLAYING</Text>
            <Text style={styles.topBarSubtitle} numberOfLines={1}>{currentTrack.title}</Text>
          </View>
          <Pressable hitSlop={12} style={styles.topBarIconRight}>
            <Ionicons name="menu" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: bottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.artworkSection}>
            <View style={styles.artworkContainer}>
              {validArtwork ? (
                <AnimatedImage
                  // @ts-ignore
                  sharedTransitionTag="artwork-player"
                  source={{ uri: currentTrack.artwork }}
                  style={[styles.artwork, { backgroundColor: Colors.surfaceHighlight }]}
                  contentFit="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <LinearGradient
                  colors={[Colors.surfaceHighlight, Colors.surface]}
                  style={styles.artworkPlaceholder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="musical-note" size={80} color={Colors.textTertiary} />
                </LinearGradient>
              )}
            </View>
          </View>

          <View style={styles.trackInfoSection}>
            <View style={styles.trackTitleRow}>
              <View style={styles.trackTitleInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
              </View>
              <View style={styles.actionIconsRow}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.tidalGray} />
                <Ionicons name="heart-outline" size={24} color={Colors.tidalGray} style={{ marginLeft: 16 }} />
              </View>
            </View>

            <View style={styles.qualityRow}>
              <View style={[styles.qualityPill, { backgroundColor: qualityColor }]}>
                <Text style={styles.qualityPillText}>
                  {getQualityLabel(quality).toUpperCase()}
                </Text>
              </View>
              <View style={styles.specsContainer}>
                <Text style={styles.audioSpecsText} numberOfLines={1}>
                  {currentTrack.format?.toUpperCase()} • {currentTrack.bitDepth || 24} bit / {currentTrack.sampleRate ? (currentTrack.sampleRate / 1000).toFixed(1) : 44.1} kHz • {currentTrack.bitrate ? (currentTrack.bitrate / 1000).toFixed(0) : 1411} kbps
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View
                 style={styles.progressBarBackground}
                 onStartShouldSetResponder={() => true}
                 onResponderGrant={(e) => handleSeekStart(e.nativeEvent.locationX, ARTWORK_SIZE)}
                 onResponderMove={(e) => handleSeekMove(e.nativeEvent.locationX, ARTWORK_SIZE)}
                 onResponderRelease={handleSeekEnd}
              >
                <View style={[styles.progressBarFill, { width: \`\${progress * 100}%\`, backgroundColor: Colors.text }]} />
                <View style={[styles.progressKnob, { left: \`\${progress * 100}%\`, backgroundColor: Colors.text }]} />
              </View>
            </View>
            <View style={styles.timeLabelsRow}>
              <Text style={styles.timeLabel}>{formatDuration(isSeeking ? seekPosition : position)}</Text>
              <Text style={styles.timeLabel}>{formatDuration(duration)}</Text>
            </View>
          </View>

          <View style={styles.mainControlsSection}>
            <BouncyButton
              onPress={handleToggleShuffle}
              hitSlop={16}
            >
              <Ionicons
                name="shuffle"
                size={24}
                color={shuffle ? Colors.tidalCyan : Colors.text}
              />
            </BouncyButton>

            <BouncyButton
              onPress={handleSkipPrevious}
              hitSlop={16}
            >
              <Ionicons name="play-skip-back" size={32} color={Colors.text} />
            </BouncyButton>

            <BouncyButton
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={54}
                color={Colors.text}
                style={!isPlaying ? { marginLeft: 6 } : undefined}
              />
            </BouncyButton>

            <BouncyButton
              onPress={handleSkipNext}
              hitSlop={16}
            >
              <Ionicons name="play-skip-forward" size={32} color={Colors.text} />
            </BouncyButton>

            <BouncyButton
              onPress={handleToggleRepeat}
              hitSlop={16}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat' : 'repeat'}
                size={24}
                color={repeatMode !== 'off' ? Colors.tidalCyan : Colors.text}
              />
              {repeatMode === 'one' && (
                <View style={styles.repeatOneBadge}>
                  <Text style={styles.repeatOneText}>1</Text>
                </View>
              )}
            </BouncyButton>
          </View>

          <View style={styles.bottomSection}>
            <BouncyButton
              onPress={() => setShowDevices(true)}
              hitSlop={12}
            >
              <Ionicons name="tv-outline" size={24} color={Colors.tidalCyan} />
            </BouncyButton>
            <BouncyButton hitSlop={12} onPress={openMetadataEditor}>
              <Ionicons name="ellipsis-horizontal" size={24} color={Colors.tidalGray} />
            </BouncyButton>
          </View>
        </ScrollView>
      </Animated.View>

      <Modal
        visible={showDevices}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDevices(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDevices(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Device</Text>
              <BouncyButton onPress={() => setShowDevices(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={28} color={Colors.surfaceHighlight} />
              </BouncyButton>
            </View>

            <View style={styles.deviceList}>
              <BouncyButton style={styles.deviceRow} onPress={() => setShowDevices(false)}>
                <Ionicons name="phone-portrait-outline" size={24} color={Colors.tidalCyan} />
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, { color: Colors.tidalCyan }]}>This Phone</Text>
                  <Text style={styles.deviceState}>Active Device</Text>
                </View>
                <Ionicons name="checkmark" size={24} color={Colors.tidalCyan} />
              </BouncyButton>

              <BouncyButton style={styles.deviceRow} onPress={() => setShowDevices(false)}>
                <Ionicons name="headset-outline" size={24} color={Colors.textSecondary} />
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>Cuffie Bluetooth</Text>
                  <Text style={styles.deviceState}>Non connesse</Text>
                </View>
              </BouncyButton>

              <BouncyButton style={styles.deviceRow} onPress={() => setShowDevices(false)}>
                <Ionicons name="bluetooth-outline" size={24} color={Colors.textSecondary} />
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>Auricolari</Text>
                  <Text style={styles.deviceState}>Non connesse</Text>
                </View>
              </BouncyButton>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showMetadataEditor}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMetadataEditor(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowMetadataEditor(false)}>
            <Pressable style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Metadata</Text>
                <BouncyButton onPress={() => setShowMetadataEditor(false)} hitSlop={8}>
                  <Ionicons name="close-circle" size={28} color={Colors.surfaceHighlight} />
                </BouncyButton>
              </View>

              <View style={styles.editForm}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Track Title"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>Artist</Text>
                <TextInput
                  style={styles.textInput}
                  value={editArtist}
                  onChangeText={setEditArtist}
                  placeholder="Artist Name"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>Album</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAlbum}
                  onChangeText={setEditAlbum}
                  placeholder="Unknown Album"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="done"
                />

                <BouncyButton
                  style={styles.saveButton}
                  onPress={handleSaveMetadata}
                  scaleTo={0.95}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </BouncyButton>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Animated Toast */}
      <Animated.View style={[styles.toastContainer, animatedToastStyle, { top: topInset + 10 }]}>
        <Ionicons
          name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'}
          size={24}
          color={toastType === 'success' ? Colors.tidalCyan : Colors.primary}
        />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </Animated.View>
  );`
    );
}

fs.writeFileSync(path, content);
console.log('Fix complete!');
