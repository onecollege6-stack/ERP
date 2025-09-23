import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import locationAPI, { State, District, Taluka } from '../services/locationAPI';

interface LocationSelectorProps {
  selectedState?: number | string;
  selectedDistrict?: number | string;
  selectedTaluka?: number | string;
  districtText?: string;
  talukaText?: string;
  onStateChange?: (stateId: number, state: State) => void;
  onDistrictChange?: (districtId: number, district: District) => void;
  onTalukaChange?: (talukaId: number, taluka: Taluka) => void;
  onDistrictTextChange?: (text: string) => void;
  onTalukaTextChange?: (text: string) => void;
  disabled?: boolean;
  required?: boolean;
  showTaluka?: boolean;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedState,
  selectedDistrict,
  selectedTaluka,
  districtText,
  talukaText,
  onStateChange,
  onDistrictChange,
  onTalukaChange,
  onDistrictTextChange,
  onTalukaTextChange,
  disabled = false,
  required = false,
  showTaluka = true,
  className = ""
}) => {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [loading, setLoading] = useState({
    states: false,
    districts: false,
    talukas: false
  });

  // Load states on component mount
  useEffect(() => {
    const loadStates = async () => {
      setLoading(prev => ({ ...prev, states: true }));
      try {
        const statesData = await locationAPI.getStates();
        setStates(statesData);
      } catch (error) {
        console.error('Error loading states:', error);
      } finally {
        setLoading(prev => ({ ...prev, states: false }));
      }
    };
    loadStates();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedState) {
        setDistricts([]);
        setTalukas([]);
        return;
      }

      setLoading(prev => ({ ...prev, districts: true }));
      try {
        const stateId = typeof selectedState === 'string' ? parseInt(selectedState) : selectedState;
        const districtsData = await locationAPI.getDistrictsByState(stateId);
        setDistricts(districtsData);
        setTalukas([]); // Clear talukas when state changes
      } catch (error) {
        console.error('Error loading districts:', error);
      } finally {
        setLoading(prev => ({ ...prev, districts: false }));
      }
    };
    loadDistricts();
  }, [selectedState]);

  // Load talukas when district changes
  useEffect(() => {
    const loadTalukas = async () => {
      if (!selectedDistrict || !showTaluka) {
        setTalukas([]);
        return;
      }

      setLoading(prev => ({ ...prev, talukas: true }));
      try {
        const districtId = typeof selectedDistrict === 'string' ? parseInt(selectedDistrict) : selectedDistrict;
        const talukasData = await locationAPI.getTalukasByDistrict(districtId);
        setTalukas(talukasData);
      } catch (error) {
        console.error('Error loading talukas:', error);
      } finally {
        setLoading(prev => ({ ...prev, talukas: false }));
      }
    };
    loadTalukas();
  }, [selectedDistrict, showTaluka]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = parseInt(e.target.value);
    const state = states.find(s => s.id === stateId);
    if (state && onStateChange) {
      onStateChange(stateId, state);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value);
    const district = districts.find(d => d.id === districtId);
    if (district && onDistrictChange) {
      onDistrictChange(districtId, district);
    }
  };

  const handleTalukaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const talukaId = parseInt(e.target.value);
    const taluka = talukas.find(t => t.id === talukaId);
    if (taluka && onTalukaChange) {
      onTalukaChange(talukaId, taluka);
    }
  };

  const selectClassName = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;
  const inputClassName = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;
  
  // Check if Karnataka is selected (Karnataka has ID 11)
  const isKarnatakaSelected = selectedState === 11 || selectedState === '11';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* State Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          State {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedState || ''}
            onChange={handleStateChange}
            disabled={disabled || loading.states}
            required={required}
            className={selectClassName}
          >
            <option value="">
              {loading.states ? 'Loading states...' : 'Select State'}
            </option>
            {states.map(state => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* District Dropdown/Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          District {required && <span className="text-red-500">*</span>}
        </label>
        {isKarnatakaSelected ? (
          <div className="relative">
            <select
              value={selectedDistrict || ''}
              onChange={handleDistrictChange}
              disabled={disabled || loading.districts || !selectedState}
              required={required}
              className={selectClassName}
            >
              <option value="">
                {loading.districts 
                  ? 'Loading districts...' 
                  : !selectedState 
                  ? 'Select state first' 
                  : 'Select District'
                }
              </option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        ) : (
          <input
            type="text"
            value={districtText || ''}
            onChange={(e) => onDistrictTextChange && onDistrictTextChange(e.target.value)}
            disabled={disabled || !selectedState}
            required={required}
            className={inputClassName}
            placeholder={!selectedState ? 'Select state first' : 'Enter district name'}
          />
        )}
      </div>

      {/* Taluka Dropdown/Input */}
      {showTaluka && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taluka/Taluk {required && <span className="text-red-500">*</span>}
          </label>
          {isKarnatakaSelected ? (
            <div className="relative">
              <select
                value={selectedTaluka || ''}
                onChange={handleTalukaChange}
                disabled={disabled || loading.talukas || !selectedDistrict}
                required={required}
                className={selectClassName}
              >
                <option value="">
                  {loading.talukas 
                    ? 'Loading talukas...' 
                    : !selectedDistrict 
                    ? 'Select district first' 
                    : 'Select Taluka'
                  }
                </option>
                {talukas.map(taluka => (
                  <option key={taluka.id} value={taluka.id}>
                    {taluka.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            <input
              type="text"
              value={talukaText || ''}
              onChange={(e) => onTalukaTextChange && onTalukaTextChange(e.target.value)}
              disabled={disabled || (!selectedState || (!isKarnatakaSelected && !districtText))}
              required={required}
              className={inputClassName}
              placeholder={!selectedState ? 'Select state first' : isKarnatakaSelected ? 'Select district first' : 'Enter taluka name'}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
