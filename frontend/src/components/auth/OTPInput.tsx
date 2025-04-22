import React from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-sm font-medium text-muted-foreground text-center">
        Enter the 6-digit verification code
      </div>
      <InputOTP
        value={value}
        onChange={onChange}
        maxLength={6}
        disabled={disabled}
        render={({ slots }) => (
          <InputOTPGroup>
            {slots.map((slot, i) => (
              <React.Fragment key={i}>
                <InputOTPSlot {...slot} />
                {i === 2 && <InputOTPSeparator />}
              </React.Fragment>
            ))}
          </InputOTPGroup>
        )}
      />
    </div>
  );
} 