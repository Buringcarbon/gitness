import {
  ButtonVariation,
  Container,
  FlexExpander,
  Formik,
  FormikForm,
  Button,
  FormInput,
  Layout,
  Text,
  FontVariation,
  useToaster
} from '@harness/uicore'
import { useMutate } from 'restful-react'
import { FormGroup } from '@blueprintjs/core'
import { useHistory } from 'react-router-dom'
import * as yup from 'yup'
import React from 'react'
import type { OpenapiUpdateWebhookRequest, EnumWebhookTrigger, OpenapiWebhookType } from 'services/code'
import { getErrorMessage } from 'utils/Utils'
import { useStrings } from 'framework/strings'
import type { GitInfoProps } from 'utils/GitUtils'
import { useAppContext } from 'AppContext'
import css from './WehookForm.module.scss'

enum WebhookEventType {
  PUSH = 'push',
  ALL = 'all',
  INDIVIDUAL = 'individual'
}

enum WebhookIndividualEvent {
  BRANCH_CREATED = 'branch_created',
  BRANCH_UPDATED = 'branch_updated',
  BRANCH_DELETED = 'branch_deleted',
  TAG_CREATED = 'tag_created',
  TAG_UPDATED = 'tag_updated',
  TAG_DELETED = 'tag_deleted',
  PR_CREATED = 'pullreq_created',
  PR_REOPENED = 'pullreq_reopened',
  PR_BRANCH_UPDATED = 'pullreq_branch_updated'
}

const SECRET_MASK = '********'

interface FormData {
  name: string
  description: string
  url: string
  secret: string
  enabled: boolean
  secure: boolean
  events: WebhookEventType
  branchCreated: boolean
  branchUpdated: boolean
  branchDeleted: boolean
  tagCreated: boolean
  tagUpdated: boolean
  tagDeleted: boolean
  prCreated: boolean
  prReopened: boolean
  prBranchUpdated: boolean
}

interface WebHookFormProps extends Pick<GitInfoProps, 'repoMetadata'> {
  isEdit?: boolean
  webhook?: OpenapiWebhookType
}

export function WehookForm({ repoMetadata, isEdit, webhook }: WebHookFormProps) {
  const history = useHistory()
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const { routes } = useAppContext()
  const { mutate, loading } = useMutate<OpenapiWebhookType>({
    verb: isEdit ? 'PATCH' : 'POST',
    path: `/api/v1/repos/${repoMetadata.path}/+/webhooks${isEdit ? `/${webhook?.id}` : ''}`
  })

  return (
    <Container padding="xxlarge">
      <Layout.Vertical className={css.form}>
        <Formik<FormData>
          initialValues={{
            name: webhook?.display_name || '',
            description: webhook?.description || '',
            url: webhook?.url || '',
            secret: isEdit && webhook?.has_secret ? SECRET_MASK : '',
            enabled: webhook ? (webhook?.enabled as boolean) : true,
            secure: webhook ? (webhook?.insecure === false as boolean) : true,
            branchCreated: webhook?.triggers?.includes(WebhookIndividualEvent.BRANCH_CREATED) || false,
            branchUpdated: webhook?.triggers?.includes(WebhookIndividualEvent.BRANCH_UPDATED) || false,
            branchDeleted: webhook?.triggers?.includes(WebhookIndividualEvent.BRANCH_DELETED) || false,
            tagCreated: webhook?.triggers?.includes(WebhookIndividualEvent.TAG_CREATED) || false,
            tagUpdated: webhook?.triggers?.includes(WebhookIndividualEvent.TAG_UPDATED) || false,
            tagDeleted: webhook?.triggers?.includes(WebhookIndividualEvent.TAG_DELETED) || false,
            prCreated: webhook?.triggers?.includes(WebhookIndividualEvent.PR_CREATED) || false,
            prReopened: webhook?.triggers?.includes(WebhookIndividualEvent.PR_REOPENED) || false,
            prBranchUpdated: webhook?.triggers?.includes(WebhookIndividualEvent.PR_BRANCH_UPDATED) || false,
            events: (webhook?.triggers?.length || 0) > 0 ? WebhookEventType.INDIVIDUAL : WebhookEventType.ALL
          }}
          formName="create-webhook-form"
          enableReinitialize={true}
          validateOnChange
          validateOnBlur
          validationSchema={yup.object().shape({
            name: yup.string().trim().required(),
            url: yup.string().required().url()
          })}
          onSubmit={formData => {
            const triggers: EnumWebhookTrigger[] = []

            if (formData.events == WebhookEventType.INDIVIDUAL) {
              if (formData.branchCreated) {
                triggers.push(WebhookIndividualEvent.BRANCH_CREATED)
              }
              if (formData.branchUpdated) {
                triggers.push(WebhookIndividualEvent.BRANCH_UPDATED)
              }
              if (formData.branchDeleted) {
                triggers.push(WebhookIndividualEvent.BRANCH_DELETED)
              }

              if (formData.tagCreated) {
                triggers.push(WebhookIndividualEvent.TAG_CREATED)
              }
              if (formData.tagUpdated) {
                triggers.push(WebhookIndividualEvent.TAG_UPDATED)
              }
              if (formData.tagDeleted) {
                triggers.push(WebhookIndividualEvent.TAG_DELETED)
              }

              if (formData.prCreated) {
                triggers.push(WebhookIndividualEvent.PR_CREATED)
              }
              if (formData.prReopened) {
                triggers.push(WebhookIndividualEvent.PR_REOPENED)
              }
              if (formData.prBranchUpdated) {
                triggers.push(WebhookIndividualEvent.PR_BRANCH_UPDATED)
              }

              if (!triggers.length) {
                return showError(getString('oneMustBeSelected'))
              }
            }

            const secret = (formData.secret || '').trim()

            const data: OpenapiUpdateWebhookRequest = {
              display_name: formData.name,
              description: formData.description,
              url: formData.url,
              secret: secret !== SECRET_MASK ? secret : undefined,
              enabled: formData.enabled,
              insecure: !formData.secure,
              triggers
            }

            mutate(data)
              .then(() => {
                showSuccess(getString(isEdit ? 'webhookUpdated' : 'webhookCreated'))
                history.push(
                  routes.toCODEWebhooks({
                    repoPath: repoMetadata.path as string
                  })
                )
              })
              .catch(exception => {
                showError(getErrorMessage(exception))
              })
          }}>
          {formik => {
            const { values } = formik

            return (
              <FormikForm>
                <FormInput.Text
                  name="name"
                  label={getString('name')}
                  placeholder={getString('nameYourWebhook')}
                  tooltipProps={{ dataTooltipId: 'webhookName' }}
                  inputGroup={{ autoFocus: true }}
                />

                <FormInput.TextArea
                  name="description"
                  label={getString('description')}
                  tooltipProps={{ dataTooltipId: 'webhookDescription' }}
                />

                <FormInput.Text
                  name="url"
                  label={getString('payloadUrlLabel')}
                  placeholder={getString('samplePayloadUrl')}
                  tooltipProps={{ dataTooltipId: 'payloadUrl' }}
                />

                <FormInput.Text
                  name="secret"
                  label={getString('secret')}
                  placeholder={getString('enterSecret')}
                  tooltipProps={{ dataTooltipId: 'secret' }}
                  inputGroup={{ type: 'password' }}
                />

                <FormGroup className={css.eventRadioGroup}>
                  <FormInput.RadioGroup
                    name="events"
                    className={css.eventRadioGroup}
                    label={getString('webhookEventsLabel')}
                    items={[
                      // { label: getString('webhookSelectPushEvents'), value: WebhookEventType.PUSH, disabled: true }, // Better to hide than disable for now
                      { label: getString('webhookSelectAllEvents'), value: WebhookEventType.ALL },
                      { label: getString('webhookSelectIndividualEvents'), value: WebhookEventType.INDIVIDUAL }
                    ]}
                  />
                  {values.events === WebhookEventType.INDIVIDUAL ? (
                    <article
                      style={{ display: 'flex', gap: '6rem', flexWrap: 'wrap', marginLeft: '30px', marginTop: '10px' }}>
                      <section>
                        <FormInput.CheckBox
                          label={getString('webhookBranchCreated')}
                          name="branchCreated"
                          className={css.checkbox}
                        />
                        <FormInput.CheckBox
                          label={getString('webhookBranchUpdated')}
                          name="branchUpdated"
                          className={css.checkbox}
                        />
                        <FormInput.CheckBox
                          label={getString('webhookBranchDeleted')}
                          name="branchDeleted"
                          className={css.checkbox}
                        />
                      </section>
                      <section>
                        <FormInput.CheckBox
                          label={getString('webhookTagCreated')}
                          name="tagCreated"
                          className={css.checkbox}
                        />
                        <FormInput.CheckBox
                          label={getString('webhookTagUpdated')}
                          name="tagUpdated"
                          className={css.checkbox}
                        />
                        <FormInput.CheckBox
                          label={getString('webhookTagDeleted')}
                          name="tagDeleted"
                          className={css.checkbox}
                        />
                      </section>
                      <section>
                        <FormInput.CheckBox
                          label={getString('webhookPRCreated')}
                          name="prCreated"
                          className={css.checkbox}
                        />
                        <FormInput.CheckBox
                          label={getString('webhookPRReopened')}
                          name="prReopened"
                          className={css.checkbox}
                        />
                        <FormInput.CheckBox
                          label={getString('webhookPRBranchUpdated')}
                          name="prBranchUpdated"
                          className={css.checkbox}
                        />
                      </section>
                    </article>
                  ) : null}
                </FormGroup>

                <FormGroup>
                  <div className={css.sslVerificationLabel}>
                    <Text
                      font={{ variation: FontVariation.FORM_LABEL, weight: 'bold' }}
                      padding={{ bottom: 10 }}
                      className="bp3-label">
                      {getString('sslVerificationLabel')}
                    </Text>
                    <FormInput.CheckBox label={getString('enableSSLVerification')} name="secure" />
                  </div>
                </FormGroup>

                <FormGroup>
                  <div className={css.sslVerificationLabel}>
                    <Text
                      font={{ variation: FontVariation.FORM_LABEL, weight: 'bold' }}
                      padding={{ bottom: 10 }}
                      className="bp3-label">
                      {getString('enabled')}
                    </Text>
                    <FormInput.CheckBox label={''} name="enabled" />
                  </div>
                </FormGroup>

                <Layout.Horizontal spacing="medium" padding={{ top: 'large' }}>
                  <Button
                    type="submit"
                    text={getString(isEdit ? 'updateWebhook' : 'createWebhook')}
                    variation={ButtonVariation.PRIMARY}
                    disabled={loading}
                  />

                  <Button
                    text={getString('cancel')}
                    variation={ButtonVariation.TERTIARY}
                    onClick={() =>
                      history.push(
                        routes.toCODEWebhooks({
                          repoPath: repoMetadata.path as string
                        })
                      )
                    }
                  />
                  <FlexExpander />
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </Container>
  )
}
