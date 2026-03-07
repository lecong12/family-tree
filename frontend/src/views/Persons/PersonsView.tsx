'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// SỬA ĐƯỜNG DẪN IMPORT Ở ĐÂY
import { Person } from '../../services/personService';
import { useAuth } from '../../context/AuthContext';
import { useFamilyData } from '../../hooks/useFamilyData';

import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import PersonDetailModal from '../../components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from '../../components/AddSpouseModal/AddSpouseModal';
import AddChildModal from '../../components/AddChildModal/AddChildModal';
import AddPersonModal from '../../components/AddPersonModal/AddPersonModal';
import GuestCodeModal from '../../components/GuestCodeModal/GuestCodeModal';

import Header from './components/Header';
import Toolbar from './components/Toolbar';
import PersonList from './components/PersonList';
import Pagination from './components/Pagination';
import { FilterMode, PageSize, SortDirection, SortField } from './types';
import { buildConnectedIds } from './utils';
import FamilyTreeFlow from '../../components/FamilyTree/FamilyTreeFlow';
