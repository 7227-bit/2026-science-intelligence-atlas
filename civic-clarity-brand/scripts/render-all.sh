#!/usr/bin/env bash
# Civic Clarity — deterministic render pipeline. Output paths are fixed; see README.md.
# Usage: scripts/render-all.sh [ident|alpha|mezzanine|stills|components|all]
set -euo pipefail
cd "$(dirname "$0")/.."
: "${REMOTION_BROWSER_EXECUTABLE:=}"
BUNDLE=out/bundle
D=deliverables
mkdir -p out "$D/ident" "$D/youtube" "$D/components" out/mezzanine
R="npx remotion"
bundle() { $R bundle src/index.ts --out-dir="$BUNDLE" --log=error >/dev/null; }

ident() {
  $R render "$BUNDLE" CivicClarityIdent "$D/ident/civic-clarity-ident_3840x2160_24p_4.5s.mp4" \
    --codec=h264 --crf=14 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --x264-preset=slow --log=error
  # Silent version: identical picture stream, audio track removed (no re-encode => frame-identical).
  ffmpeg -hide_banner -loglevel error -y -i "$D/ident/civic-clarity-ident_3840x2160_24p_4.5s.mp4" -map 0:v -c copy \
    "$D/ident/civic-clarity-ident_3840x2160_24p_4.5s_SILENT.mp4"
  cp public/audio/civic-clarity-sonic-ident.wav "$D/ident/civic-clarity-sonic-ident_48k24b.wav"
}
identv2() {
  # Revision Round 2 candidate (WebGL2 plate compositor -> needs ANGLE/SwiftShader: --gl=swangle)
  mkdir -p "$D/ident/v2"
  $R render "$BUNDLE" CivicClarityIdentV2 "$D/ident/v2/civic-clarity-ident-V2_3840x2160_24p_4.5s.mp4" \
    --gl=swangle --codec=h264 --crf=14 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --x264-preset=slow --log=error
  ffmpeg -hide_banner -loglevel error -y -i "$D/ident/v2/civic-clarity-ident-V2_3840x2160_24p_4.5s.mp4" -map 0:v -c copy \
    "$D/ident/v2/civic-clarity-ident-V2_3840x2160_24p_4.5s_SILENT.mp4"
}
identv3() {
  # Visual Fidelity Correction candidate (WebGL2 -> --gl=swangle)
  mkdir -p "$D/ident/v3"
  $R render "$BUNDLE" CivicClarityIdentV3 "$D/ident/v3/civic-clarity-ident-V3_3840x2160_24p_4.5s.mp4" \
    --gl=swangle --codec=h264 --crf=14 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --x264-preset=slow --log=error
  ffmpeg -hide_banner -loglevel error -y -i "$D/ident/v3/civic-clarity-ident-V3_3840x2160_24p_4.5s.mp4" -map 0:v -c copy \
    "$D/ident/v3/civic-clarity-ident-V3_3840x2160_24p_4.5s_SILENT.mp4"
}
identv4() {
  mkdir -p "$D/ident/v4"
  $R render "$BUNDLE" CivicClarityIdentV4 "$D/ident/v4/civic-clarity-ident-V4_3840x2160_24p_4.5s.mp4" \
    --gl=swangle --codec=h264 --crf=14 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --x264-preset=slow --log=error
  ffmpeg -hide_banner -loglevel error -y -i "$D/ident/v4/civic-clarity-ident-V4_3840x2160_24p_4.5s.mp4" -map 0:v -c copy \
    "$D/ident/v4/civic-clarity-ident-V4_3840x2160_24p_4.5s_SILENT.mp4"
}
mezzaninev2() {
  $R render "$BUNDLE" CivicClarityIdentV2 out/mezzanine/civic-clarity-ident-V2_3840x2160_24p_ProRes422HQ.mov \
    --gl=swangle --codec=prores --prores-profile=hq --image-format=png --log=error
}
alpha() {
  $R render "$BUNDLE" CivicClarityIdentAlpha "$D/ident/civic-clarity-ident-title_ALPHA_3840x2160_24p.webm" \
    --codec=vp9 --image-format=png --pixel-format=yuva420p --crf=18 --muted --log=error
}
mezzanine() {
  $R render "$BUNDLE" CivicClarityIdent out/mezzanine/civic-clarity-ident_3840x2160_24p_ProRes422HQ.mov \
    --codec=prores --prores-profile=hq --image-format=png --log=error
  $R render "$BUNDLE" CivicClarityIdentAlpha out/mezzanine/civic-clarity-ident-title_ALPHA_3840x2160_24p_ProRes4444.mov \
    --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le --muted --log=error
}
stills() {
  $R still "$BUNDLE" CivicClarityAvatar "$D/youtube/civic-clarity_avatar_1024.png" --log=error
  $R still "$BUNDLE" CivicClarityAvatar "$D/youtube/civic-clarity_avatar_1024_CROP-GUIDE.png" --props='{"showCropGuide":true}' --log=error
  $R still "$BUNDLE" CivicClarityAvatar "$D/youtube/civic-clarity_avatar-dome_1024.png" --props='{"variant":"dome"}' --log=error
  $R still "$BUNDLE" CivicClarityBanner "$D/youtube/civic-clarity_banner_2560x1440.png" --log=error
  $R still "$BUNDLE" CivicClarityBanner "$D/youtube/civic-clarity_banner_2560x1440_SAFE-AREA-GUIDES.png" --props='{"showSafeGuides":true}' --log=error
  $R still "$BUNDLE" CivicClarityThumbnail "$D/youtube/civic-clarity_thumbnail-A-institution_1280x720.png" --log=error
  $R still "$BUNDLE" CivicClarityThumbnailEvidence "$D/youtube/civic-clarity_thumbnail-B-evidence_1280x720.png" --log=error
  $R still "$BUNDLE" CivicClarityThumbnail "$D/youtube/civic-clarity_thumbnail-A_GUIDES.png" --props='{"showSafeGuides":true}' --log=error
}
components() {
  for c in TitleCard LowerThird EvidenceCard EndCard; do
    $R still "$BUNDLE" "CivicClarity$c" "$D/components/civic-clarity_${c}_still.png" --frame=72 --scale=0.5 --log=error
  done
  $R still "$BUNDLE" CivicClarityLowerThird "$D/components/civic-clarity_LowerThird_lowBandwidth_still.png" --frame=72 --scale=0.5 --props='{"variant":"lowBandwidth","context":"Interview recorded for this film"}' --log=error
  $R still "$BUNDLE" CivicClarityEvidenceCard "$D/components/civic-clarity_EvidenceCard_reconstruction_still.png" --frame=72 --scale=0.5 --props='{"kind":"reconstruction","excerpt":"Illustrative reconstruction — not original footage or a real document."}' --log=error
  $R still "$BUNDLE" CivicClarityEvidenceCard "$D/components/civic-clarity_EvidenceCard_lowBandwidth_still.png" --frame=72 --scale=0.5 --props='{"variant":"lowBandwidth"}' --log=error
  $R still "$BUNDLE" CivicClarityEndCard "$D/components/civic-clarity_EndCard_endscreen-slots_still.png" --frame=72 --scale=0.5 --props='{"showEndScreenSlots":true}' --log=error
  # Motion previews of overlays (1080p, ProRes 4444 alpha for the lower third is available via the mezzanine pattern)
  $R render "$BUNDLE" CivicClarityLowerThird "$D/components/civic-clarity_LowerThird_ALPHA_1080p.webm" --codec=vp9 --image-format=png --pixel-format=yuva420p --scale=0.5 --muted --log=error
  $R render "$BUNDLE" CivicClarityTitleCard "$D/components/civic-clarity_TitleCard_preview_1080p.mp4" --codec=h264 --crf=18 --scale=0.5 --muted --log=error
}

bundle
case "${1:-all}" in
  ident) ident ;;
  identv2) identv2 ;;
  identv3) identv3 ;;
  identv4) identv4 ;;
  mezzaninev2) mezzaninev2 ;;
  alpha) alpha ;;
  mezzanine) mezzanine ;;
  stills) stills ;;
  components) components ;;
  all) ident; alpha; stills; components ;;
esac
echo "render-all: ${1:-all} complete"
