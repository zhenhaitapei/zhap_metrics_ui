import React, { FC, ReactElement } from 'react';
import { selectors } from '@grafana/e2e-selectors';
import { useTranslation } from 'react-i18next';

import { FormModel } from './LoginCtrl';
import { Button, Form, Input, Field } from '@grafana/ui';
import { css } from 'emotion';

interface Props {
  children: ReactElement;
  onSubmit: (data: FormModel) => void;
  isLoggingIn: boolean;
  passwordHint: string;
  loginHint: string;
}

const wrapperStyles = css`
  width: 100%;
  padding-bottom: 16px;
`;

export const submitButton = css`
  justify-content: center;
  width: 100%;
`;

export const LoginForm: FC<Props> = ({ children, onSubmit, isLoggingIn, passwordHint, loginHint }) => {
  const { t } = useTranslation();
  return (
    <div className={wrapperStyles}>
      <Form onSubmit={onSubmit} validateOn="onChange">
        {({ register, errors }) => {
          const userErrorMessage: string = errors.user?.message || '';
          const passwordErrorMessage: string = errors.password?.message || '';
          return (
            <>
              <Field label={t('Email or username')} invalid={!!errors.user} error={t(userErrorMessage)}>
                <Input
                  autoFocus
                  name="user"
                  ref={register({ required: 'Email or username is required' })}
                  placeholder={t(loginHint)}
                  aria-label={selectors.pages.Login.username}
                />
              </Field>
              <Field label={t('Password')} invalid={!!errors.password} error={t(passwordErrorMessage)}>
                <Input
                  name="password"
                  type="password"
                  placeholder={t(passwordHint)}
                  ref={register({ required: 'Password is required' })}
                  aria-label={selectors.pages.Login.password}
                />
              </Field>
              <Button aria-label={selectors.pages.Login.submit} className={submitButton} disabled={isLoggingIn}>
                {t(isLoggingIn ? 'Logging in...' : 'Log in')}
              </Button>
              {children}
            </>
          );
        }}
      </Form>
    </div>
  );
};
