import { useState, useEffect } from 'react';
import { BookOpen, Link, FileText, Headphones, MessageCircle, Bookmark, X, ChevronRight, Rocket } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

const ONBOARDING_KEY = 'nlm_onboarding_done';

interface Step {
  icon: React.ElementType;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: BookOpen,
    titleKey: 'onboarding.step1Title',
    descKey: 'onboarding.step1Desc',
    color: 'text-notebooklm-blue bg-blue-50',
  },
  {
    icon: Link,
    titleKey: 'onboarding.step2Title',
    descKey: 'onboarding.step2Desc',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Rocket,
    titleKey: 'onboarding.step3Title',
    descKey: 'onboarding.step3Desc',
    color: 'text-emerald-600 bg-emerald-50',
  },
];

export function OnboardingGuide() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    chrome.storage.local.get(ONBOARDING_KEY, (result) => {
      if (!result[ONBOARDING_KEY]) {
        setVisible(true);
      }
    });
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    chrome.storage.local.set({ [ONBOARDING_KEY]: true });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  if (!visible) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="mx-4 mt-3 mb-1 animate-fade-in">
      <div className="relative bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-100/60 rounded-xl p-4 shadow-soft">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-6 bg-notebooklm-blue'
                  : i < currentStep
                    ? 'w-3 bg-notebooklm-blue/40'
                    : 'w-3 bg-gray-200'
              }`}
            />
          ))}
          <span className="ml-auto text-[10px] text-gray-400">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>

        {/* Step content */}
        <div className="flex gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${step.color} flex items-center justify-center`}>
            <StepIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 mb-0.5">
              {t(step.titleKey)}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t(step.descKey)}
            </p>
          </div>
        </div>

        {/* Feature pills */}
        {currentStep === 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[
              { icon: FileText, label: t('onboarding.featureDocs') },
              { icon: Headphones, label: t('onboarding.featurePodcast') },
              { icon: MessageCircle, label: t('onboarding.featureAI') },
              { icon: Bookmark, label: t('onboarding.featureBookmark') },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-white/80 border border-gray-100 rounded-full px-2 py-0.5">
                <Icon className="w-2.5 h-2.5" />
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          className="btn-press mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-notebooklm-blue text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-btn"
        >
          {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
