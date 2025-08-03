'use client'

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { CustomSelect } from './custom-select'
import { ProfileFormInput } from './profile-form-input'
import { UpdateUserProfileData, User } from '@/types'
import { useTranslations } from 'next-intl'
import { Tooltip } from './tooltip'
import { CustomDatePicker } from './custom-date-picker'
import { IconCustom } from './icon-custom'
import { useUser } from '@/helpers/contexts/user-context'
import { Loader } from './loader'
import { ButtonCustom } from './button-custom'
import { useProfileForm } from '@/helpers/contexts/profile-form-context'
import { formatPhoneNumber } from '@/helpers/functions/format-phone-number'
import { useRouter } from '@/i18n/routing'
import { useAuth } from '@/helpers/contexts/auth-context'
import { userService } from '@/services/api/user.service'
import { useLocale } from 'next-intl'
import { CustomCountryDropdown } from './custom-country-dropdown'

interface ProfileInformationFormProps {
  onMouseEnter: (
    field:
      | 'nickname'
      | 'name'
      | 'surname'
      | 'gender'
      | 'birthday'
      | 'email'
      | 'phoneNumber'
      | 'extraPhoneNumber'
  ) => void
  onMouseLeave: (
    field:
      | 'nickname'
      | 'name'
      | 'surname'
      | 'gender'
      | 'birthday'
      | 'email'
      | 'phoneNumber'
      | 'extraPhoneNumber'
  ) => void
  onTooltipClick: (
    field:
      | 'nickname'
      | 'name'
      | 'surname'
      | 'gender'
      | 'birthday'
      | 'email'
      | 'phoneNumber'
      | 'extraPhoneNumber'
  ) => void
  tooltipVisible: Record<
    | 'nickname'
    | 'name'
    | 'surname'
    | 'gender'
    | 'birthday'
    | 'email'
    | 'phoneNumber'
    | 'extraPhoneNumber',
    boolean
  >
  isTooltipClicked: Record<
    | 'nickname'
    | 'name'
    | 'surname'
    | 'gender'
    | 'birthday'
    | 'email'
    | 'phoneNumber'
    | 'extraPhoneNumber'
    | 'language'
    | 'currency'
    | 'city'
    | 'notifications'
    | 'showPhone'
    | 'advancedUser'
    | 'deleteReason',
    boolean
  >
  externalNicknameError?: string
}

export const ProfileInformationForm = ({
  onMouseEnter,
  onMouseLeave,
  onTooltipClick,
  tooltipVisible,
  isTooltipClicked,
  externalNicknameError,
}: ProfileInformationFormProps) => {
  const { user, updateUser } = useUser()
  const { handleAuthSuccess } = useAuth()
  const { setSubmitForm, setIsSubmitDisabled } = useProfileForm()
  const tProfile = useTranslations('Profile')
  const locale = useLocale()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isAvatarHovered, setIsAvatarHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const phoneContainerRef = useRef<HTMLDivElement>(null)
  const extraPhoneContainerRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    nickname: '',
    name: '',
    surname: '',
    gender: '' as 'Male' | 'Female' | '',
    birthday: '',
    email: '',
    phoneNumber: '' as string | undefined,
    phoneCode: '+380', // Default country code for phoneNumber
    extraPhoneNumber: '' as string | undefined,
    extraPhoneCode: '+380', // Default country code for extraPhoneNumber
    avatar: null as File | null,
    removeAvatar: false,
  })

  const [errors, setErrors] = useState<{
    nickname: string
    email: string
    phoneNumber: string
    extraPhoneNumber: string
    avatarError: string
    server: string
  }>({
    nickname: externalNicknameError || '',
    email: '',
    phoneNumber: '',
    extraPhoneNumber: '',
    avatarError: '',
    server: '',
  })

  const [isComponentOpen, setIsComponentOpen] = useState({
    gender: false,
    birthday: false,
  })

  const genderOptions = [
    { value: 'Male' as const, translationKey: 'informationFormInputs.male' },
    { value: 'Female' as const, translationKey: 'informationFormInputs.female' },
  ]

  const countryCodes = [
    '+380', '+48', '+1', '+49', '+44', '+33', '+39', '+34', '+61'
  ]

  const extractPhoneCodeAndNumber = (phone: string | undefined) => {
    if (!phone) return { code: '+380', number: '' }
    const cleanedPhone = phone.replace(/[^0-9+]/g, '') // Удаляем все, кроме цифр и +
    const matchedCode = countryCodes.find(code => cleanedPhone.startsWith(code))
    if (matchedCode) {
      const number = cleanedPhone.slice(matchedCode.length) // Извлекаем номер без кода
      return {
        code: matchedCode,
        number: getPhoneMask(number, matchedCode), // Форматируем номер
      }
    }
    return { code: '+380', number: getPhoneMask(cleanedPhone.replace(/^\+/, ''), '+380') }
  }

  useEffect(() => {
    if (user) {
      const { code: phoneCode, number: phoneNumber } = extractPhoneCodeAndNumber(user.phoneNumber)
      const { code: extraPhoneCode, number: extraPhoneNumber } = extractPhoneCodeAndNumber(user.extraPhoneNumber || undefined)
      setFormData({
        nickname: user.nickname || '',
        name: user.name || '',
        surname: user.legalSurname || '',
        gender: user.gender || '',
        birthday: user.birthday || '',
        email: user.email || '',
        phoneNumber: phoneNumber,
        phoneCode: phoneCode,
        extraPhoneNumber: extraPhoneNumber,
        extraPhoneCode: extraPhoneCode,
        avatar: null,
        removeAvatar: false,
      })
    }
  }, [user])

  useLayoutEffect(() => {
    setErrors(prev => ({ ...prev, nickname: externalNicknameError || '' }))
  }, [externalNicknameError])

  useLayoutEffect(() => {
    const isFormValid =
      formData.nickname.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phoneNumber?.trim() !== '' &&
      !errors.nickname &&
      !errors.email &&
      // !errors.avatarError &&
      !isLoading
    setIsSubmitDisabled(!isFormValid)
  }, [formData, errors, isLoading, setIsSubmitDisabled])

  const validateNickname = (value: string) => {
    if (!value.trim()) {
      return tProfile('informationFormInputs.errorNicknameRequired')
    }
    if (value.length > 0 && value.length <= 3) {
      return tProfile('informationFormInputs.errorNickname')
    }
    return ''
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return tProfile('informationFormInputs.errorEmailRequired')
    }
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return tProfile('informationFormInputs.errorEmail')
    }
    return ''
  }
  const validatePhoneNumber = (value: string) => {
    const cleanValue = value.replace(/[^0-9+]/g, ''); // Удаляем все, кроме цифр и +
    if (!cleanValue) {
      return tProfile('informationFormInputs.errorPhoneRequired');
    }
    if (!cleanValue.startsWith('+')) {
      return tProfile('informationFormInputs.errorPhoneNumber');
    }
    const digits = cleanValue.replace(/^\+/, ''); // Удаляем +
    const countryCode = cleanValue.startsWith('+380') ? '380' : digits.slice(0, digits.length - 9);
    const phoneDigits = digits.slice(countryCode.length); // Извлекаем цифры номера
    if (phoneDigits.length < 7) {
      return tProfile('informationFormInputs.errorPhoneNumber');
    }
    if (cleanValue.startsWith('+380') && phoneDigits.length !== 9) {
      return tProfile('informationFormInputs.errorPhoneNumber');
    }
    return '';
  };

  const getPhoneMask = (value: string, code: string) => {
    let cleanedValue = value.replace(/[^0-9]/g, '')
    if (!cleanedValue) return ''
    switch (code) {
      case '+380':
        cleanedValue = cleanedValue.slice(0, 9); // Ограничиваем до 9 цифр
        if (cleanedValue.length >= 9) {
          return cleanedValue.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4');
        }
      case '+48':
        if (cleanedValue.length >= 9) {
          return cleanedValue.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
        }
        return cleanedValue
      case '+1':
        if (cleanedValue.length >= 10) {
          return cleanedValue.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
        }
        return cleanedValue
      case '+49':
        if (cleanedValue.length >= 7) {
          return cleanedValue.replace(/(\d{3})(\d{4})/, '$1 $2')
        }
        return cleanedValue
      case '+44':
        if (cleanedValue.length >= 10) {
          return cleanedValue.replace(/(\d{4})(\d{6})/, '$1 $2')
        }
        return cleanedValue
      case '+33':
        if (cleanedValue.length >= 10) {
          return cleanedValue.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
        }
        return cleanedValue
      case '+39':
        if (cleanedValue.length >= 10) {
          return cleanedValue.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
        }
        return cleanedValue
      case '+34':
        if (cleanedValue.length >= 9) {
          return cleanedValue.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
        }
        return cleanedValue
      case '+61':
        if (cleanedValue.length >= 10) {
          return cleanedValue.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3')
        }
        return cleanedValue
      default:
        return cleanedValue
    }
  }

  const getPhoneMaskPlaceholder = (code: string) => {
    switch (code) {
      case '+380':
        return 'XX (XXX) XX-XX'
      case '+48':
        return 'XXX XXX XXX'
      case '+1':
        return '(XXX) XXX-XXXX'
      case '+49':
        return 'XXX XXXX'
      case '+44':
        return 'XXXX XXXXXX'
      case '+33':
        return 'XX XX XX XX XX'
      case '+39':
        return 'XXX XXX XXXX'
      case '+34':
        return 'XXX XXX XXX'
      case '+61':
        return 'XX XXXX XXXX'
      default:
        return 'XXXXXXXXXX'
    }
  }

  const handleInputChange =
    (field: keyof typeof formData) => (value: string) => {
      let newValue = value
      if (field === 'phoneNumber') {
        const cleanedValue = value.replace(/[^0-9]/g, '')
        newValue = getPhoneMask(cleanedValue, formData.phoneCode)
      } else if (field === 'extraPhoneNumber') {
        const cleanedValue = value.replace(/[^0-9]/g, '')
        newValue = getPhoneMask(cleanedValue, formData.extraPhoneCode)
      } else if (field === 'gender') {
        const selectedOption = genderOptions.find(
          opt => tProfile(opt.translationKey) === value
        )
        newValue = selectedOption ? selectedOption.value : ''
      }
      setFormData({ ...formData, [field]: newValue })
      setErrors({
        ...errors,
        [field]:
          field === 'nickname'
            ? validateNickname(newValue)
            : field === 'email'
            ? validateEmail(newValue)
            : field === 'phoneNumber'
            ? validatePhoneNumber(formData.phoneCode + newValue.replace(/\s/g, ''))
            : field === 'extraPhoneNumber'
            ? validatePhoneNumber(formData.extraPhoneCode + newValue.replace(/\s/g, ''))
            : '',
        server: '',
      })
    }

  const handlePhoneCountryChange = (code: string) => {
    setFormData(prev => {
      const cleanedNumber = prev.phoneNumber?.replace(/[^0-9]/g, '') || ''
      const newFormattedNumber = getPhoneMask(cleanedNumber, code)
      return {
        ...prev,
        phoneCode: code,
        phoneNumber: newFormattedNumber,
      }
    })
  }

  const handleExtraPhoneCountryChange = (code: string) => {
    setFormData(prev => {
      const cleanedNumber = prev.extraPhoneNumber?.replace(/[^0-9]/g, '') || ''
      const newFormattedNumber = getPhoneMask(cleanedNumber, code)
      return {
        ...prev,
        extraPhoneCode: code,
        extraPhoneNumber: newFormattedNumber,
      }
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, avatarError: tProfile('errors.avatarSize') })
        return
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setErrors({ ...errors, avatarError: tProfile('errors.avatarFormat') })
        return
      }
      setFormData({ ...formData, avatar: file, removeAvatar: false })
      setErrors({ ...errors, avatarError: '', server: '' })
    }
  }

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFormData({ ...formData, avatar: null, removeAvatar: true })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleMouseEnter = (
    field: keyof typeof tooltipVisible,
    isOpen: boolean
  ) => {
    if (!isOpen) {
      onMouseEnter(field)
    }
  }

  const handleMouseLeave = (
    field: keyof typeof tooltipVisible,
    isOpen: boolean
  ) => {
    if (!isOpen) {
      onMouseLeave(field)
    }
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    console.log('handleSubmit called with formData:', formData);
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrors({
      nickname: '',
      email: '',
      phoneNumber: '',
      extraPhoneNumber: '',
      avatarError: '',
      server: '',
    });
  
    const nicknameError = validateNickname(formData.nickname);
    const emailError = validateEmail(formData.email);
    const phoneNumberError = validatePhoneNumber(
      formData.phoneCode + (formData.phoneNumber || '').replace(/[^0-9]/g, '') // Удаляем все, кроме цифр
    );
    const extraPhoneNumberError = formData.extraPhoneNumber
      ? validatePhoneNumber(
          formData.extraPhoneCode + (formData.extraPhoneNumber || '').replace(/[^0-9]/g, '')
        )
      : '';
  
    if (nicknameError || emailError || phoneNumberError || extraPhoneNumberError) {
      console.log('Validation errors in handleSubmit:', {
        nicknameError,
        emailError,
        phoneNumberError,
        extraPhoneNumberError,
        cleanedPhone: formData.phoneCode + (formData.phoneNumber || '').replace(/[^0-9]/g, ''),
        cleanedExtraPhone: formData.extraPhoneNumber
          ? formData.extraPhoneCode + (formData.extraPhoneNumber || '').replace(/[^0-9]/g, '')
          : 'N/A',
      });
      setErrors({
        nickname: nicknameError,
        email: emailError,
        phoneNumber: phoneNumberError,
        extraPhoneNumber: extraPhoneNumberError,
        avatarError: '',
        server: '',
      });
      setIsLoading(false);
      return;
    }
  
    if (!user || !user.id) {
      console.error('User or user.id is undefined:', user);
      setErrors((prev) => ({ ...prev, server: tProfile('errors.userNotFound') }));
      setIsLoading(false);
      return;
    }
  
    try {
      const updateData: UpdateUserProfileData = {
        email: formData.email || undefined,
        name: formData.name || null,
        legalSurname: formData.surname || null,
        nickname: formData.nickname || undefined,
        phoneNumber: formData.phoneNumber
          ? formData.phoneCode + (formData.phoneNumber || '').replace(/[^0-9]/g, '')
          : undefined,
        extraPhoneNumber: formData.extraPhoneNumber
          ? formData.extraPhoneCode + (formData.extraPhoneNumber || '').replace(/[^0-9]/g, '')
          : null,
        gender: formData.gender === '' ? null : (formData.gender as 'Male' | 'Female'),
        birthday: formData.birthday || null,
        avatar: formData.avatar || undefined,
        removeAvatar: formData.removeAvatar || undefined,
      };
      console.log('Sending updateData to server:', updateData);
      const updatedUser = await userService.updateUserProfile(user.id, updateData);
      console.log('Server response:', updatedUser);
      updateUser(updatedUser);
      handleAuthSuccess(
        {
          user: updatedUser,
          accessToken: localStorage.getItem('accessToken')!,
          refreshToken: localStorage.getItem('refreshToken')!,
        },
        false
      );
      console.log('Redirecting to /selling-classifieds');
      router.replace('/selling-classifieds');
    } catch (error: any) {
      console.error('Server error in handleSubmit:', error, error.response?.data);
      let errorMessage = tProfile('errors.serverError');
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setErrors((prev) => ({ ...prev, server: errorMessage }));
      alert(errorMessage); // Временное уведомление
    } finally {
      setIsLoading(false);
    }
  }, [formData, setErrors, setIsLoading, tProfile, user, updateUser, handleAuthSuccess, router]);
  useEffect(() => {
    setSubmitForm(() => handleSubmit)
  }, [handleSubmit])
  
  useLayoutEffect(() => {
    setSubmitForm(() => handleSubmit)
  }, [setSubmitForm, formData, user])

  if (!user || isLoading) {
    return (
      <div className='flex flex-col items-center justify-center'>
        <Loader />
      </div>
    )
  }

  return (
    <div className='flex justify-center gap-[74px] max-sm:flex-col max-sm:gap-[60px]'>
      {/* left info */}
      <div className='flex sm:flex-col items-center gap-8'>
        {/* avatar */}
        <div
          className='relative w-[120px] h-[120px] rounded-[13px] cursor-pointer'
          onMouseEnter={() => setIsAvatarHovered(true)}
          onMouseLeave={() => setIsAvatarHovered(false)}
          onClick={handleAvatarClick}
        >
          {formData.avatar ? (
            <img
              src={URL.createObjectURL(formData.avatar)}
              alt='Preview'
              className='w-full h-full object-cover rounded-[13px]'
            />
          ) : user.avatarUrl && !formData.removeAvatar ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User'}
              className='w-full h-full object-cover rounded-[13px]'
            />
          ) : (
            <div className='w-full h-full bg-[#F7F7F7] flex items-center justify-center rounded-[13px]'>
              <IconCustom
                name='camera'
                className='w-8 h-8 text-[#BDBDBD] fill-none'
              />
            </div>
          )}
          {(formData.avatar || (user.avatarUrl && !formData.removeAvatar)) && (
            <div
              className={`absolute inset-0 bg-black/50 flex items-center justify-center rounded-[13px] transition-opacity ${
                isAvatarHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ButtonCustom
                onClick={handleRemoveAvatar}
                iconWrapperClass='w-8 h-8'
                icon={
                  <IconCustom
                    name='trash'
                    className='w-8 h-8 text-white fill-none'
                  />
                }
                className='w-6 h-6 flex items-center justify-center'
              />
            </div>
          )}
          <input
            type='file'
            accept='image/jpeg,image/png'
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className='hidden'
          />
        </div>

        <div className='flex flex-col gap-8 max-sm:w-[176px]'>
          {/* trust rating */}
          <div className='flex flex-col items-center'>
            <p className='font-bold text-[16px] text-[#3486FE]'>
              {user.trustRating}
            </p>
            <p className='font-bold text-[16px] text-[#4F4F4F]'>
              {tProfile('trustRating')}
            </p>
          </div>
          {/* bonuses */}
          <div className='flex flex-col items-center'>
            <p className='font-bold text-[16px] text-[#3486FE]'>
              <span className='text-[#F9329C]'>U</span>
              {user.bonuses}
            </p>
            <p className='font-bold text-[16px] text-[#4F4F4F]'>
              {tProfile('bonuses')}
            </p>
          </div>
        </div>
      </div>
      {/* right info */}
      <form className='space-y-2 w-full sm:w-[300px]' onSubmit={handleSubmit}>
        {/* nickname */}
        <div
          className='relative'
          onMouseEnter={() => onMouseEnter('nickname')}
          onMouseLeave={() => onMouseLeave('nickname')}
        >
          <ProfileFormInput
            label={tProfile('informationFormInputs.yourNickname')}
            onChange={handleInputChange('nickname')}
            onClick={() => !user.advancedUser && onTooltipClick('nickname')}
            maxLength={16}
            value={formData.nickname}
            error={errors.nickname}
            isValid={formData.nickname.length > 3 && !errors.nickname}
          />
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.nickname.name')}
              text={tProfile('informationTooltips.nickname.description')}
              visible={tooltipVisible.nickname}
              isClicked={isTooltipClicked.nickname}
            />
          )}
        </div>

        {/* document name */}
        <div className='max-sm:pr-7 py-4'>
          <p className='font-bold text-[16px] text-[#3486FE] mb-[2px]'>
            {tProfile('informationFormInputs.documentName')}
          </p>
          <p className='font-normal text-[16px] text-[#4F4F4F]'>
            {tProfile('informationFormInputs.documentNameDescr')}
          </p>
        </div>

        {/* name */}
        <div
          className='relative'
          onMouseEnter={() => onMouseEnter('name')}
          onMouseLeave={() => onMouseLeave('name')}
        >
          <ProfileFormInput
            label={tProfile('informationFormInputs.legalName')}
            onChange={handleInputChange('name')}
            onClick={() => !user.advancedUser && onTooltipClick('name')}
            value={formData.name}
          />
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.legalName.name')}
              text={tProfile('informationTooltips.legalName.description')}
              visible={tooltipVisible.name}
              isClicked={isTooltipClicked.name}
            />
          )}
        </div>

        {/* surname */}
        <div
          className='relative'
          onMouseEnter={() => onMouseEnter('surname')}
          onMouseLeave={() => onMouseLeave('surname')}
        >
          <ProfileFormInput
            label={tProfile('informationFormInputs.legalSurname')}
            onChange={handleInputChange('surname')}
            onClick={() => !user.advancedUser && onTooltipClick('surname')}
            value={formData.surname}
          />
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.legalSurname.name')}
              text={tProfile('informationTooltips.legalSurname.description')}
              visible={tooltipVisible.surname}
              isClicked={isTooltipClicked.surname}
            />
          )}
        </div>

        {/* gender */}
        <div
          className='relative'
          onMouseEnter={() =>
            handleMouseEnter('gender', isComponentOpen.gender)
          }
          onMouseLeave={() =>
            handleMouseLeave('gender', isComponentOpen.gender)
          }
        >
          <CustomSelect
            label={tProfile('informationFormInputs.gender')}
            options={genderOptions.map(opt => tProfile(opt.translationKey))}
            value={
              formData.gender
                ? tProfile(
                    genderOptions.find(opt => opt.value === formData.gender)!
                      .translationKey
                  )
                : ''
            }
            onChange={handleInputChange('gender')}
            onClick={() => !user.advancedUser && onTooltipClick('gender')}
            onOpenChange={isOpen =>
              setIsComponentOpen(prev => ({ ...prev, gender: isOpen }))
            }
          />
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.gender.name')}
              text={tProfile('informationTooltips.gender.description')}
              visible={tooltipVisible.gender}
              isClicked={isTooltipClicked.gender}
            />
          )}
        </div>

        {/* birthday */}
        <div
          className='relative'
          onMouseEnter={() =>
            handleMouseEnter('birthday', isComponentOpen.birthday)
          }
          onMouseLeave={() =>
            handleMouseLeave('birthday', isComponentOpen.birthday)
          }
        >
          <CustomDatePicker
            label={tProfile('informationFormInputs.birthday')}
            value={formData.birthday}
            onChange={handleInputChange('birthday')}
            onClick={() => !user.advancedUser && onTooltipClick('birthday')}
            onOpenChange={isOpen =>
              setIsComponentOpen(prev => ({ ...prev, birthday: isOpen }))
            }
          />
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.dateOfBirth.name')}
              text={tProfile('informationTooltips.dateOfBirth.description')}
              visible={tooltipVisible.birthday}
              isClicked={isTooltipClicked.birthday}
            />
          )}
        </div>

        {/* email */}
        <div
          className='relative'
          onMouseEnter={() => onMouseEnter('email')}
          onMouseLeave={() => onMouseLeave('email')}
        >
          <ProfileFormInput
            label={tProfile('informationFormInputs.emailAddress')}
            onChange={handleInputChange('email')}
            onClick={() => !user.advancedUser && onTooltipClick('email')}
            value={formData.email}
            error={errors.email}
            type='email'
            isValid={formData.email.length > 0 && !errors.email}
          />
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.email.name')}
              text={tProfile('informationTooltips.email.description')}
              visible={tooltipVisible.email}
              isClicked={isTooltipClicked.email}
            />
          )}
        </div>

        {/* phoneNumber */}
        <div className='py-4'>
        <div
          className='relative'
          onMouseEnter={() => onMouseEnter('phoneNumber')}
          onMouseLeave={() => onMouseLeave('phoneNumber')}
        >
          <div
            className='flex items-center border-b border-[#bdbdbd] h-[38px] w-full combined-phone-input'
            onClick={() => !user.advancedUser && onTooltipClick('phoneNumber')}
            ref={phoneContainerRef}
          >
            <CustomCountryDropdown
              label={tProfile('informationFormInputs.countryCode')}
              value={formData.phoneCode}
              onChange={handlePhoneCountryChange}
              languageCode={locale as 'en' | 'uk' | 'pl'}
              onOpenChange={(isOpen) => {
                if (!isOpen) onMouseLeave('phoneNumber')
                else onMouseEnter('phoneNumber')
              }}
              showLabel={false}
              className='pr-2 dropdown'
              containerWidth={phoneContainerRef.current?.offsetWidth}
            />
            <ProfileFormInput
              label='' // No label to avoid overlap
              onChange={handleInputChange('phoneNumber')}
              value={formData.phoneNumber || ''}
              type='tel'
              error={errors.phoneNumber}
              isValid={!!formData.phoneNumber && !errors.phoneNumber}
              className='flex-1 pl-2 border-none outline-none input h-full text-[16px] font-bold'
              placeholder={getPhoneMaskPlaceholder(formData.phoneCode)}
            />
          </div>
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.phoneNumber.name')}
              text={tProfile('informationTooltips.phoneNumber.description')}
              visible={tooltipVisible.phoneNumber}
              isClicked={isTooltipClicked.phoneNumber}
            />
          )}
        </div>
        </div>
        {/* extraPhoneNumber */}
        <div className='py-4'>

        <div
          className='relative'
          onMouseEnter={() => onMouseEnter('extraPhoneNumber')}
          onMouseLeave={() => onMouseLeave('extraPhoneNumber')}
        >
          <div
            className='flex items-center border-b border-[#bdbdbd] h-[38px] w-full combined-phone-input'
            onClick={() => !user.advancedUser && onTooltipClick('extraPhoneNumber')}
            ref={extraPhoneContainerRef}
          >
            <CustomCountryDropdown
              label={tProfile('informationFormInputs.countryCode')}
              value={formData.extraPhoneCode}
              onChange={handleExtraPhoneCountryChange}
              languageCode={locale as 'en' | 'uk' | 'pl'}
              onOpenChange={(isOpen) => {
                if (!isOpen) onMouseLeave('extraPhoneNumber')
                else onMouseEnter('extraPhoneNumber')
              }}
              showLabel={false}
              className='pr-2 dropdown'
              containerWidth={extraPhoneContainerRef.current?.offsetWidth}
            />
            <ProfileFormInput
              label='' // No label to avoid overlap
              onChange={handleInputChange('extraPhoneNumber')}
              value={formData.extraPhoneNumber || ''}
              type='tel'
              error={errors.extraPhoneNumber}
              isValid={!!formData.extraPhoneNumber && !errors.extraPhoneNumber}
              className='flex-1 pl-2 border-none outline-none input h-full text-[16px] font-bold'
              placeholder={getPhoneMaskPlaceholder(formData.extraPhoneCode)}
            />
          </div>
          {!user.advancedUser && (
            <Tooltip
              title={tProfile('informationTooltips.extraPhoneNumber.name')}
              text={tProfile('informationTooltips.extraPhoneNumber.description')}
              visible={tooltipVisible.extraPhoneNumber}
              isClicked={isTooltipClicked.extraPhoneNumber}
            />
          )}
        </div>
        </div>

      </form>
    </div>
  )
}