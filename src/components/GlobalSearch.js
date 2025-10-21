'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (isOpen) {
        if (e.key === 'Escape') {
          setIsOpen(false);
          setQuery('');
          setResults(null);
          setSelectedIndex(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, getTotalResults() - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          handleResultClick(getSelectedResult());
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
        setResults(null);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    performSearch(value);
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return results.products.length + results.customers.length +
           results.batches.length + results.sales.length + results.orders.length;
  };

  const getSelectedResult = () => {
    if (!results || selectedIndex < 0) return null;

    const allResults = [
      ...results.products,
      ...results.customers,
      ...results.batches,
      ...results.sales,
      ...results.orders
    ];

    return allResults[selectedIndex];
  };

  const handleResultClick = (result) => {
    if (!result) return;

    setIsOpen(false);
    setQuery('');
    setResults(null);
    setSelectedIndex(-1);

    // Navigate based on result type
    switch (result.result_type) {
      case 'product':
        window.location.href = '/manager'; // Could be enhanced to go to specific product page
        break;
      case 'customer':
        window.location.href = '/sales-person/customers';
        break;
      case 'batch':
        window.location.href = '/farm-worker/batches';
        break;
      case 'sale':
        window.location.href = '/sales-person/sales';
        break;
      case 'order':
        window.location.href = '/sales-person/orders';
        break;
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'product': return '📦';
      case 'customer': return '👤';
      case 'batch': return '🐔';
      case 'sale': return '💰';
      case 'order': return '📋';
      default: return '🔍';
    }
  };

  const renderResults = () => {
    if (!results || loading) return null;

    const sections = [
      { key: 'products', title: 'Products', data: results.products },
      { key: 'customers', title: 'Customers', data: results.customers },
      { key: 'batches', title: 'Batches', data: results.batches },
      { key: 'sales', title: 'Sales', data: results.sales },
      { key: 'orders', title: 'Orders', data: results.orders }
    ];

    let currentIndex = 0;

    return (
      <div className="max-h-96 overflow-y-auto">
        {sections.map(section => {
          if (section.data.length === 0) return null;

          return (
            <div key={section.key} className="border-b border-gray-100 last:border-b-0">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900">
                  {section.title} ({section.data.length})
                </h3>
              </div>
              {section.data.map((item, index) => {
                const globalIndex = currentIndex++;
                const isSelected = globalIndex === selectedIndex;

                return (
                  <div
                    key={`${section.key}-${item.id}`}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleResultClick(item)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getResultIcon(item.result_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.display_text}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.result_type.charAt(0).toUpperCase() + item.result_type.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {getTotalResults() === 0 && query.length >= 2 && (
          <div className="px-4 py-8 text-center text-gray-500">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No results found for "{query}"</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search everything... (Press / to focus)"
          className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 2 || loading) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : (
            renderResults()
          )}
        </div>
      )}
    </div>
  );
}
