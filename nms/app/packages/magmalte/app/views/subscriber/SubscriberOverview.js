/*
 * Copyright 2020 The Magma Authors.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @flow strict-local
 * @format
 */
import type {WithAlert} from '@fbcnms/ui/components/Alert/withAlert';

import ActionTable from '../../components/ActionTable';
import AddSubscriberButton from './SubscriberAddDialog';
import Button from '@material-ui/core/Button';
import CardTitleRow from '../../components/layout/CardTitleRow';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import PeopleIcon from '@material-ui/icons/People';
import React from 'react';
import SubscriberContext from '../../components/context/SubscriberContext';
import SubscriberDetail from './SubscriberDetail';
import TopBar from '../../components/TopBar';
import withAlert from '@fbcnms/ui/components/Alert/withAlert';

import {Redirect, Route, Switch} from 'react-router-dom';
import {colors, typography} from '../../theme/default';
import {makeStyles} from '@material-ui/styles';
import {useContext, useState} from 'react';
import {useEnqueueSnackbar} from '@fbcnms/ui/hooks/useSnackbar';
import {useRouter} from '@fbcnms/ui/hooks';

const TITLE = 'Subscribers';

const useStyles = makeStyles(theme => ({
  dashboardRoot: {
    margin: theme.spacing(5),
  },
  appBarBtn: {
    color: colors.primary.white,
    background: colors.primary.comet,
    fontFamily: typography.button.fontFamily,
    fontWeight: typography.button.fontWeight,
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    letterSpacing: typography.button.letterSpacing,

    '&:hover': {
      background: colors.primary.mirage,
    },
  },
  appBarBtnSecondary: {
    color: colors.primary.white,
  },
}));

export default function SubscriberDashboard() {
  const {relativePath, relativeUrl} = useRouter();
  return (
    <Switch>
      <Route
        path={relativePath('/overview/:subscriberId')}
        component={SubscriberDetail}
      />

      <Route
        path={relativePath('/overview')}
        component={SubscriberDashboardInternal}
      />
      <Redirect to={relativeUrl('/overview')} />
    </Switch>
  );
}

type SubscriberRowType = {
  name: string,
  imsi: string,
  service: string,
  currentUsage: string,
  dailyAvg: string,
  lastReportedTime: Date,
};

function SubscriberDashboardInternal() {
  const classes = useStyles();
  return (
    <>
      <TopBar
        header={TITLE}
        tabs={[
          {
            label: 'Subscribers',
            to: '/subscribersv2',
            icon: PeopleIcon,
            filters: (
              <Grid
                container
                justify="flex-end"
                alignItems="center"
                spacing={2}>
                <Grid item>
                  {/* TODO: these button styles need to be localized */}
                  <Button variant="text" className={classes.appBarBtnSecondary}>
                    Secondary Action
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" className={classes.appBarBtn}>
                    Primary Action
                  </Button>
                </Grid>
              </Grid>
            ),
          },
        ]}
      />
      <SubscriberTable />
    </>
  );
}

function SubscriberTableRaw(props: WithAlert) {
  const classes = useStyles();
  const {history, relativeUrl} = useRouter();
  const [currRow, setCurrRow] = useState<SubscriberRowType>({});
  const ctx = useContext(SubscriberContext);
  const subscriberMap = ctx.state;
  const subscriberMetrics = ctx.metrics;
  const enqueueSnackbar = useEnqueueSnackbar();

  return (
    <div className={classes.dashboardRoot}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <CardTitleRow
            icon={PeopleIcon}
            label={TITLE}
            filter={AddSubscriberButton}
          />

          {subscriberMap ? (
            <ActionTable
              data={Object.keys(subscriberMap).map((imsi: string) => {
                const subscriberInfo = subscriberMap[imsi];
                const metrics = subscriberMetrics?.[`${imsi}`];
                return {
                  name: subscriberInfo.name ?? imsi,
                  imsi: imsi,
                  service: subscriberInfo.lte.state,
                  currentUsage: metrics?.currentUsage ?? '0',
                  dailyAvg: metrics?.dailyAvg ?? '0',
                  lastReportedTime: new Date(
                    subscriberInfo.monitoring?.icmp?.last_reported_time ?? 0,
                  ),
                };
              })}
              columns={[
                {title: 'Name', field: 'name'},
                {
                  title: 'IMSI',
                  field: 'imsi',
                  render: currRow => (
                    <Link
                      variant="body2"
                      component="button"
                      onClick={() =>
                        history.push(relativeUrl('/' + currRow.imsi))
                      }>
                      {currRow.imsi}
                    </Link>
                  ),
                },
                {title: 'Service', field: 'service', width: 100},
                {title: 'Current Usage', field: 'currentUsage', width: 175},
                {title: 'Daily Average', field: 'dailyAvg', width: 175},
                {
                  title: 'Last Reported Time',
                  field: 'lastReportedTime',
                  type: 'datetime',
                  width: 200,
                },
              ]}
              handleCurrRow={(row: SubscriberRowType) => setCurrRow(row)}
              menuItems={[
                {
                  name: 'View',
                  handleFunc: () => {
                    history.push(relativeUrl('/' + currRow.imsi));
                  },
                },
                {
                  name: 'Edit',
                  handleFunc: () => {
                    history.push(relativeUrl('/' + currRow.imsi + '/config'));
                  },
                },
                {
                  name: 'Remove',
                  handleFunc: () => {
                    props
                      .confirm(
                        `Are you sure you want to delete ${currRow.imsi}?`,
                      )
                      .then(async confirmed => {
                        if (!confirmed) {
                          return;
                        }

                        try {
                          await ctx.setState?.(currRow.imsi);
                        } catch (e) {
                          enqueueSnackbar(
                            'failed deleting subscriber ' + currRow.imsi,
                            {
                              variant: 'error',
                            },
                          );
                        }
                      });
                  },
                },
              ]}
              options={{
                actionsColumnIndex: -1,
                pageSizeOptions: [10, 20],
              }}
            />
          ) : (
            '<Text>No Subscribers Found</Text>'
          )}
        </Grid>
      </Grid>
    </div>
  );
}
const SubscriberTable = withAlert(SubscriberTableRaw);
