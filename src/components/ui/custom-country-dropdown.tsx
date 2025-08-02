'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { IconCustom } from './icon-custom'
import { ButtonCustom } from './button-custom'
import { useTranslations } from 'next-intl'
import { useScreenResize } from '@/helpers/hooks/use-screen-resize'

interface Country {
  code: string
  en: string
  uk: string
  pl: string
}
interface CustomCountryDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  languageCode: 'en' | 'uk' | 'pl';
  onOpenChange?: (isOpen: boolean) => void;
  onClick?: () => void;
  showLabel?: boolean;
  failedToLoadCitiesError?: string;
  className?: string;
  containerWidth?: number; // Новый пропс для ширины
}

export const CustomCountryDropdown = ({
  label,
  value,
  onChange,
  languageCode,
  onOpenChange,
  onClick,
  showLabel = false,
  failedToLoadCitiesError,
  className,
  containerWidth
}: CustomCountryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showAsModal, setShowAsModal] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<Country[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const tComponents = useTranslations('Components')
  const { isMobile } = useScreenResize()

  const countries: Country[] = [
    { code: '+380', en: 'Ukraine', uk: 'Україна', pl: 'Ukraina' },
    { code: '+48', en: 'Poland', uk: 'Польща', pl: 'Polska' },
    { code: '+1', en: 'USA', uk: 'США', pl: 'USA' },
    { code: '+1', en: 'Canada', uk: 'Канада', pl: 'Kanada' },
    { code: '+49', en: 'Germany', uk: 'Німеччина', pl: 'Niemcy' },
    { code: '+44', en: 'United Kingdom', uk: 'Велика Британія', pl: 'Wielka Brytania' },
    { code: '+33', en: 'France', uk: 'Франція', pl: 'Francja' },
    { code: '+39', en: 'Italy', uk: 'Італія', pl: 'Włochy' },
    { code: '+34', en: 'Spain', uk: 'Іспанія', pl: 'Hiszpania' },
    { code: '+61', en: 'Australia', uk: 'Австралія', pl: 'Australia' },
  ]

  const getCountryName = (country: Country) => {
    const name = country[languageCode] ?? country.en
    return `${name}: ${country.code}`
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        modalContainerRef.current &&
        !modalContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setIsFocused(false)
        setSearchTerm('')
        onOpenChange?.(false)
        onClick?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onOpenChange, onClick])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm) {
      const filtered = countries.filter(country =>
        getCountryName(country).toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(countries)
    }
  }, [searchTerm, languageCode])

  const checkShouldShowModal = useCallback(() => {
    if (isMobile && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      return rect.top >= windowHeight / 2
    }
    return false
  }, [isMobile])

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        const shouldShowModal = checkShouldShowModal()
        setShowAsModal(shouldShowModal)
      }
    }

    if (isOpen) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen, checkShouldShowModal])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
      setIsFocused(false)
      setSearchTerm('')
      onOpenChange?.(false)
      onClick?.()
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isOpen) {
      const shouldShowModal = checkShouldShowModal()
      setShowAsModal(shouldShowModal)
      setIsOpening(true)

      requestAnimationFrame(() => {
        setIsOpen(true)
        setIsOpening(false)
        onOpenChange?.(true)
      })
    } else {
      setIsOpen(false)
      setShowAsModal(false)
      setSearchTerm('')
      onOpenChange?.(false)
    }
    onClick?.()
  }

  const handleOptionClick = (code: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(code)
    setIsOpen(false)
    setShowAsModal(false)
    setIsFocused(true)
    setSearchTerm('')
    onOpenChange?.(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleConfirmSearch = () => {
    if (searchTerm.trim()) {
      const selectedCountry = countries.find(country =>
        getCountryName(country).toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (selectedCountry) {
        onChange(selectedCountry.code)
      }
      setIsOpen(false)
      setShowAsModal(false)
      setIsFocused(true)
      setSearchTerm('')
      onOpenChange?.(false)
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const renderOptionsView = () => (
    <>
      {filteredOptions.length > 0 ? (
        filteredOptions.map(country => (
          <div
            key={country.code}
            className={`p-4 text-[16px] font-bold text-[#4f4f4f] cursor-pointer hover:bg-[#F7F7F7] ${
              value === country.code ? 'bg-[#F7F7F7]' : ''
            }`}
            onClick={e => handleOptionClick(country.code, e)}
          >
            {getCountryName(country)}
          </div>
        ))
      ) : (
        <div className='p-4 text-[16px] font-normal text-[#4f4f4f]'>
          {failedToLoadCitiesError || tComponents('placeholders.noResults')}
        </div>
      )}
    </>
  )

  const renderNormalDropdown = () => (
    <motion.div
      className={`relative h-[38px] cursor-pointer ${className || ''}`}
      transition={{ duration: 0.3 }}
      ref={containerRef}
      onClick={handleToggle}
    >
      {showLabel && (
        <label
          htmlFor={`${label.toLowerCase()}-select`}
          className={`w-fit absolute transition-all duration-300 ease-in-out text-[13px] font-normal text-[#4f4f4f] ${
            isOpen ? 'opacity-0 -top-8 left-0' : 'opacity-100 -top-8 left-0'
          }`}
        >
          {label}
        </label>
      )}
  
      <div
        id={`${(label || 'country').toLowerCase()}-select`}
        className={`relative text-[16px] font-bold text-[#4f4f4f] outline-none bg-transparent cursor-pointer flex items-center h-full pl-2 group`}
      >
        <label
          htmlFor={`${(label || 'default').toLowerCase()}-select`}
          className={`w-fit transition-all duration-300 ease-in-out text-[16px] font-bold group cursor-pointer ${
            isOpen ? 'text-[#3486fe]' : 'text-[#4f4f4f]'
          }`}
        >
          {value}
        </label>
        <div className='flex justify-center items-center w-6 h-6 group'>
          <IconCustom
            name='arrow-down-select'
            className='w-6 h-6 fill-none text-[#3486fe] group'
          />
        </div>
      </div>
      {isOpen && !isOpening && (
        <div
          ref={dropdownRef}
          className='bg-white absolute top-[38px] left-0 shadow-custom-xl rounded-b-[13px] z-40'
          style={{ width: containerWidth || containerRef.current?.offsetWidth || '100%', position: 'absolute', top: '100%' }} // Используем containerWidth
        >
          <div className='sticky top-0 bg-white z-50 border-b border-[#bdbdbd]'>
            <div className='relative flex items-center p-2 h-14'>
              <div className='absolute inset-y-0 left-4 right-4 flex items-center'>
                <IconCustom
                  name='search-glass'
                  className='w-6 h-6 fill-none text-[#BDBDBD]'
                />
                <input
                  ref={inputRef}
                  type='text'
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={tComponents('placeholders.search')}
                  className='w-full h-10 pl-10 text-[16px] font-normal text-[#4f4f4f] outline-none bg-transparent'
                />
                {searchTerm && (
                  <ButtonCustom
                    onClick={handleConfirmSearch}
                    iconWrapperClass='w-6 h-6 flex items-center justify-center'
                    icon={
                      <IconCustom
                        name='check'
                        className='w-6 h-6 fill-none text-[#4f4f4f] group-hover:text-[#f9329c] group-focus:text-[#f9329c]'
                        hover={true}
                        hoverColor='#f9329c'
                      />
                    }
                    isHover
                    className='min-w-10 h-10 flex items-center justify-center rounded-lg'
                  />
                )}
              </div>
            </div>
          </div>
          <div className='max-h-[200px] custom-scrollbar overflow-y-scroll rounded-b-[13px]'>
            {renderOptionsView()}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderModalDropdown = () => (
    <>
      <motion.div
        className='relative h-[102px] w-full pt-8'
        transition={{ duration: 0.3 }}
        ref={containerRef}
        onClick={handleToggle}
      >
        <label
          htmlFor={`${label.toLowerCase()}-select`}
          className={`w-fit absolute transition-all duration-300 ease-in-out text-[13px] font-normal text-[#4f4f4f] ${
            isOpen || label
              ? 'opacity-0 top-0 left-2'
              : 'opacity-100 top-0 left-2'
          }`}
        >
          {label}
        </label>
        <label
          htmlFor={`${label.toLowerCase()}-select`}
          className={`w-fit absolute top-9 left-2 transition-all duration-300 ease-in-out text-[16px] font-bold ${
            isOpen ? 'text-transparent ' : 'text-[#4f4f4f]'
          }`}
        >
          {value || label}
        </label>
        <div
          id={`${label.toLowerCase()}-select`}
          className='relative text-[16px] font-bold text-[#4f4f4f] outline-none border-b bg-transparent cursor-pointer flex justify-end items-center w-full h-[38px] px-2 border-[#bdbdbd]'
        >
          <div className='flex justify-center items-center w-6 h-6'>
            <IconCustom
              name='arrow-down-select'
              className='w-6 h-6 fill-none text-[#3486fe]'
            />
          </div>
        </div>
      </motion.div>

      {isOpen && !isOpening && (
        <div
          className='fixed inset-0 z-50 flex items-end max-sm:justify-start sm:justify-end pb-4 px-4'
          onClick={handleOverlayClick}
        >
          <motion.div
            className='bg-white shadow-custom-xl rounded-[13px] w-full sm:max-w-[316px] max-h-[60vh]'
            transition={{ duration: 0.3 }}
            ref={modalContainerRef}
            onClick={handleToggle}
          >
            <div className='p-4 border-b border-transparent bg-transparent flex items-center justify-between'>
              <div className='text-[16px] font-bold text-[#3486fe]'>
                {value}
              </div>
              <div className='flex justify-center items-center w-6 h-6'>
                <IconCustom
                  name='arrow-down-select'
                  className='w-6 h-6 fill-none text-[#3486fe]'
                />
              </div>
            </div>
            <div className='relative flex items-center p-2 border-b border-[#bdbdbd] h-14'>
              <div className='absolute inset-y-0 left-4 flex items-center'>
                <IconCustom
                  name='search-glass'
                  className='w-6 h-6 fill-none text-[#BDBDBD]'
                />
                <input
                  ref={inputRef}
                  type='text'
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={tComponents('placeholders.search')}
                  className='w-full h-10 px-2 pl-10 text-[16px] font-normal text-[#4f4f4f] outline-none bg-transparent'
                />
                {searchTerm && (
                  <ButtonCustom
                    onClick={handleConfirmSearch}
                    iconWrapperClass='w-6 h-6 flex items-center justify-center'
                    icon={
                      <IconCustom
                        name='check'
                        className='w-6 h-6 fill-none text-[#4f4f4f] group-hover:text-[#f9329c] group-focus:text-[#f9329c]'
                        hover={true}
                        hoverColor='#f9329c'
                      />
                    }
                    isHover
                    className='w-10 h-10 flex items-center justify-center rounded-lg'
                  />
                )}
              </div>
            </div>
            <div className='bg-white max-h-[200px] custom-scrollbar overflow-y-auto rounded-b-[13px]'>
              {renderOptionsView()}
            </div>
          </motion.div>
        </div>
      )}
    </>
  )

  const shouldRenderAsModal = isMobile && showAsModal

  if (shouldRenderAsModal) {
    return renderModalDropdown()
  } else {
    return renderNormalDropdown()
  }
}