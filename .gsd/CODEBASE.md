# Codebase Map

Generated: 2026-05-05T22:48:45Z | Files: 171 | Described: 0/171
<!-- gsd:codebase-meta {"generatedAt":"2026-05-05T22:48:45Z","fingerprint":"88b339d18dafcdb82382e508ea88d775ebbeda8c","fileCount":171,"truncated":false} -->

### (root)/
- `.gitignore`
- `implementation_plan.md`
- `package-lock.json`
- `package.json`
- `vercel.json`

### .stitch/
- `.stitch/DESIGN.md`

### api/
- `api/index.js`

### backend/
- `backend/.gitignore`
- `backend/docker-compose.yml`
- `backend/jest.config.js`
- `backend/migrateSlugs.js`
- `backend/package-lock.json`
- `backend/package.json`
- `backend/prisma.config.ts.bak`

### backend/prisma/
- `backend/prisma/dev.db`
- `backend/prisma/schema.prisma`

### backend/src/
- `backend/src/app.js`
- `backend/src/server.js`

### backend/src/controllers/
- `backend/src/controllers/adminController.js`
- `backend/src/controllers/analyticsController.js`
- `backend/src/controllers/authController.js`
- `backend/src/controllers/billingController.js`
- `backend/src/controllers/publicController.js`
- `backend/src/controllers/superadminController.js`

### backend/src/jobs/
- `backend/src/jobs/scheduler.js`

### backend/src/lib/
- `backend/src/lib/logger.js`
- `backend/src/lib/prisma.js`
- `backend/src/lib/seedDefaults.js`

### backend/src/middlewares/
- `backend/src/middlewares/authMiddleware.js`
- `backend/src/middlewares/billingMiddleware.js`
- `backend/src/middlewares/planMiddleware.js`

### backend/src/routes/
- `backend/src/routes/adminRoutes.js`
- `backend/src/routes/authRoutes.js`
- `backend/src/routes/cronRoutes.js`
- `backend/src/routes/publicRoutes.js`
- `backend/src/routes/superadminRoutes.js`

### backend/src/services/
- `backend/src/services/notificationService.js`
- `backend/src/services/paymentService.js`

### backend/tests/
- `backend/tests/adminController.test.js`
- `backend/tests/auth.test.js`
- `backend/tests/billing.test.js`
- `backend/tests/paymentService.test.js`
- `backend/tests/planMiddleware.test.js`
- `backend/tests/public.test.js`
- `backend/tests/reminder.test.js`

### docs/
- `docs/apresentacao.md`
- `docs/apresentacao.pdf`
- `docs/post-instagram.txt`

### frontend/
- `frontend/app.js`
- `frontend/index.html`
- `frontend/index.html.bak`
- `frontend/landing.css`
- `frontend/manifest.json`
- `frontend/marketing-old.html`
- `frontend/style.css`
- `frontend/style.css.bak`
- `frontend/sw.js`

### marketing_screenshots/
- `marketing_screenshots/anuncio_reels.mp4`
- `marketing_screenshots/comercial_profissional.mp4`
- `marketing_screenshots/inputs.txt`
- `marketing_screenshots/make_animated_commercial.js`
- `marketing_screenshots/make_commercial_flyers.js`
- `marketing_screenshots/make_instagram_posts.js`
- `marketing_screenshots/make_reels_assets.js`
- `marketing_screenshots/make_video.js`
- `marketing_screenshots/package-lock.json`
- `marketing_screenshots/package.json`
- `marketing_screenshots/take_screenshots.js`

### marketing_video/
- `marketing_video/index.html`

### my-video/
- `my-video/.env.example`
- `my-video/.gitignore`
- `my-video/.npmrc`
- `my-video/.prettierrc`
- `my-video/components.json`
- `my-video/config.mjs`
- `my-video/deploy.mjs`
- `my-video/eslint.config.mjs`
- `my-video/next.config.js`
- `my-video/package-lock.json`
- `my-video/package.json`
- `my-video/postcss.config.mjs`
- `my-video/README.md`
- `my-video/remotion.config.ts`
- `my-video/tsconfig.json`
- `my-video/vercel.json`

### my-video/src/
- `my-video/src/markdown.d.ts`

### my-video/src/app/
- `my-video/src/app/layout.tsx`
- `my-video/src/app/page.tsx`

### my-video/src/app/api/generate/
- `my-video/src/app/api/generate/route.ts`

### my-video/src/app/api/lambda/progress/
- `my-video/src/app/api/lambda/progress/route.ts`

### my-video/src/app/api/lambda/render/
- `my-video/src/app/api/lambda/render/route.ts`

### my-video/src/app/code-examples/
- `my-video/src/app/code-examples/page.tsx`

### my-video/src/app/generate/
- `my-video/src/app/generate/page.tsx`

### my-video/src/components/
- `my-video/src/components/ErrorDisplay.tsx`
- `my-video/src/components/Header.tsx`
- `my-video/src/components/LandingPageInput.tsx`
- `my-video/src/components/PageLayout.tsx`
- `my-video/src/components/TabPanel.tsx`

### my-video/src/components/AnimationPlayer/
- `my-video/src/components/AnimationPlayer/index.tsx`
- `my-video/src/components/AnimationPlayer/SettingsModal.tsx`

### my-video/src/components/AnimationPlayer/RenderControls/
- `my-video/src/components/AnimationPlayer/RenderControls/DownloadButton.tsx`
- `my-video/src/components/AnimationPlayer/RenderControls/Error.tsx`
- `my-video/src/components/AnimationPlayer/RenderControls/index.tsx`
- `my-video/src/components/AnimationPlayer/RenderControls/ProgressBar.tsx`

### my-video/src/components/ChatSidebar/
- `my-video/src/components/ChatSidebar/ChatHistory.tsx`
- `my-video/src/components/ChatSidebar/ChatInput.tsx`
- `my-video/src/components/ChatSidebar/ChatSidebar.tsx`
- `my-video/src/components/ChatSidebar/index.ts`

### my-video/src/components/CodeEditor/
- `my-video/src/components/CodeEditor/CodeEditor.tsx`
- `my-video/src/components/CodeEditor/CopyButton.tsx`
- `my-video/src/components/CodeEditor/EditorHeader.tsx`
- `my-video/src/components/CodeEditor/index.ts`
- `my-video/src/components/CodeEditor/StreamingOverlay.tsx`

### my-video/src/components/ui/
- `my-video/src/components/ui/alert.tsx`
- `my-video/src/components/ui/button.tsx`
- `my-video/src/components/ui/dialog.tsx`
- `my-video/src/components/ui/select.tsx`
- `my-video/src/components/ui/spinner.tsx`
- `my-video/src/components/ui/tooltip.tsx`

### my-video/src/examples/
- `my-video/src/examples/prompts.ts`

### my-video/src/examples/code/
- `my-video/src/examples/code/animated-shapes.ts`
- `my-video/src/examples/code/falling-spheres.ts`
- `my-video/src/examples/code/gold-price-chart.ts`
- `my-video/src/examples/code/histogram.ts`
- `my-video/src/examples/code/index.ts`
- `my-video/src/examples/code/lottie-animation.ts`
- `my-video/src/examples/code/progress-bar.ts`
- `my-video/src/examples/code/text-rotation.ts`
- `my-video/src/examples/code/typewriter-highlight.ts`
- `my-video/src/examples/code/word-carousel.ts`

### my-video/src/helpers/
- `my-video/src/helpers/api-response.ts`
- `my-video/src/helpers/capture-frame.ts`
- `my-video/src/helpers/sanitize-response.ts`
- `my-video/src/helpers/use-rendering.ts`

### my-video/src/hooks/
- `my-video/src/hooks/useAnimationState.ts`
- `my-video/src/hooks/useAutoCorrection.ts`
- `my-video/src/hooks/useConversationState.ts`
- `my-video/src/hooks/useGenerationApi.ts`
- `my-video/src/hooks/useImageAttachments.ts`

### my-video/src/lambda/
- `my-video/src/lambda/api.ts`

### my-video/src/lib/
- `my-video/src/lib/utils.ts`

### my-video/src/remotion/
- `my-video/src/remotion/compiler.ts`
- `my-video/src/remotion/DynamicComp.tsx`
- `my-video/src/remotion/index.ts`
- `my-video/src/remotion/Root.tsx`
- `my-video/src/remotion/webpack-override.mjs`

### my-video/src/skills/
- `my-video/src/skills/3d.md`
- `my-video/src/skills/charts.md`
- `my-video/src/skills/index.ts`
- `my-video/src/skills/messaging.md`
- `my-video/src/skills/sequencing.md`
- `my-video/src/skills/social-media.md`
- `my-video/src/skills/spring-physics.md`
- `my-video/src/skills/transitions.md`
- `my-video/src/skills/typography.md`

### my-video/src/types/
- `my-video/src/types/conversation.ts`
- `my-video/src/types/generation.ts`

### my-video/styles/
- `my-video/styles/global.css`

### my-video/types/
- `my-video/types/constants.ts`
- `my-video/types/schema.ts`

### stitch_import/
- `stitch_import/app_vercel.js`
- `stitch_import/design_system.json`
- `stitch_import/style_vercel.css`
- `stitch_import/target_vercel.html`

### stitch_import/backup/
- `stitch_import/backup/app.js.bak`
- `stitch_import/backup/index.html.bak`
- `stitch_import/backup/style.css.bak`

### stitch_import/html/
- `stitch_import/html/booking.html`
- `stitch_import/html/dashboard.html`
- `stitch_import/html/landing_page.html`
- `stitch_import/html/profile.html`
