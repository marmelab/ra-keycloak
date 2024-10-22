import * as React from 'react';
import {
    useAuthenticated,
    Datagrid,
    TextField,
    Title,
    useListController,
    ListContextProvider,
} from 'react-admin';
import type { SortPayload } from 'react-admin';

const sort = { field: 'published_at', order: 'DESC' } as SortPayload;

const CustomRouteLayout = ({ title = 'Posts' }) => {
    useAuthenticated();

    const controllerProps = useListController({
        resource: 'posts',
        perPage: 10,
        sort,
    });

    return !controllerProps.isLoading ? (
        <div>
            <Title title="Example Admin" />
            <h1>{title}</h1>
            <p>
                Found <span className="total">{controllerProps.total}</span>{' '}
                posts !
            </p>
            <ListContextProvider value={controllerProps}>
                <Datagrid resource="posts" rowClick="edit">
                    <TextField source="id" sortable={false} />
                    <TextField source="title" sortable={false} />
                </Datagrid>
            </ListContextProvider>
        </div>
    ) : null;
};

export default CustomRouteLayout;
