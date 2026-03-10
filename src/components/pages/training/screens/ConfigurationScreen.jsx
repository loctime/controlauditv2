import React from 'react';
import ConfigurationHub from '../components/configuration/ConfigurationHub';

export default function ConfigurationScreen({ activeSection = 'catalog', onSectionChange }) {
  return <ConfigurationHub activeSection={activeSection} onSectionChange={onSectionChange} />;
}
