import { useState, useEffect } from 'react';
import { createStore } from '@react-pdf-viewer/core';

// Custom hook for managing viewer instance state
const useViewerInstance = () => {
    const [viewerInstance, setViewerInstance] = useState(null);

    const onViewerInstance = (instance) => {
        setViewerInstance(instance);
    };

    return { viewerInstance, onViewerInstance };
};

// Plugin factory function
export const useViewerInstancePlugin = () => {
    const { viewerInstance, onViewerInstance } = useViewerInstance();
    const store = createStore({
        viewerInstance: null,
    });

    useEffect(() => {
        if (viewerInstance) {
            store.update('viewerInstance', viewerInstance);
        }
    }, [viewerInstance]);

    return {
        install: (pluginFunctions) => {
            onViewerInstance(pluginFunctions.viewer);
        },
        getViewerInstance: () => store.get('viewerInstance'),
    };
};
