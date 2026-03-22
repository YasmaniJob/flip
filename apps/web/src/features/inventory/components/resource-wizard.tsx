'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { WizardStep1 } from './wizard-step-1';
import { WizardStep2 } from './wizard-step-2';

interface ResourceWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export interface WizardData {
    // Step 1
    mode: 'individual' | 'batch';
    quantity: number;
    categoryId?: string;
    categoryName?: string;
    templateId?: string;
    templateData?: {
        name: string;
        icon?: string;
        defaultBrand?: string;
        defaultModel?: string;
    };

    // Step 2
    name: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    condition: string;
    status: string;
    notes?: string;
}

export function ResourceWizard({ open, onOpenChange, onSuccess }: ResourceWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [wizardData, setWizardData] = useState<Partial<WizardData>>({
        mode: 'individual',
        quantity: 1,
        condition: 'bueno',
        status: 'disponible',
    });

    const handleStep1Complete = (data: Partial<WizardData>) => {
        setWizardData({ ...wizardData, ...data });
        setCurrentStep(2);
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleSuccess = () => {
        setCurrentStep(1);
        setWizardData({
            mode: 'individual',
            quantity: 1,
            condition: 'bueno',
            status: 'disponible',
        });
        onSuccess?.();
        onOpenChange(false);
    };

    const handleCancel = () => {
        setCurrentStep(1);
        setWizardData({
            mode: 'individual',
            quantity: 1,
            condition: 'bueno',
            status: 'disponible',
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "p-0 gap-0 overflow-hidden bg-transparent border-none shadow-none transition-all duration-300",
                    isFullscreen
                        ? "max-w-none w-screen h-screen rounded-none"
                        : "sm:max-w-[1020px] w-[95vw] h-[85vh] rounded-none"
                )}
            >
                <DialogTitle className="sr-only">Asistente de Nuevo Recurso</DialogTitle>
                {currentStep === 1 && (
                    <WizardStep1
                        data={wizardData}
                        onNext={handleStep1Complete}
                        onCancel={handleCancel}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                    />
                )}

                {currentStep === 2 && (
                    <WizardStep2
                        data={wizardData}
                        onBack={handleBack}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
