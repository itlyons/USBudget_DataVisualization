
```{r}
cbo_spend <- read_csv(file = 'raw_data/CBO_SPENDING_PROJECTION.csv')
cbo_long <- cbo_spend %>% gather(fiscal_year, expenditure, '2019':'2029', factor_key = TRUE)
colnames(cbo_long) <- c("Treasury ID Number", 
                        "Title", 
                        "Category", 
                        "CBO Major Category", 
                        "Agency Name",
                        "Bureau Name", 
                        "Function", 
                        "Subfunction", 
                        "Off/On-budget", 
                        "fiscal_year", 
                        "Expenditure")

#Get the agencies that we can make apples to apples comparisons for. 
agencies_common <- unique((budget_longform %>% filter(`Agency Name` %in% cbo_long$`Agency Name`))$`Agency Name`) 

cbo_outlays <- cbo_long %>% 
  select(fiscal_year, `Agency Name`, Expenditure) %>% 
  group_by(fiscal_year, `Agency Name`) %>% 
  summarize(projection = sum(Expenditure, na.rm = TRUE))
# Put the cbo spending numbers in the name units as OMB spending numbers
cbo_outlays <- cbo_outlays %>% mutate(projection = projection*1000) 
cbo_outlays <-  cbo_outlays %>% mutate(office = 'CBO')

omb_outlays <- outlays %>% filter(fiscal_year %in% c(2019, 2020, 2021, 2022, 2023))
colnames(omb_outlays) <- c('fiscal_year', 'Agency Name', 'projection')
omb_outlays <- omb_outlays %>% mutate(office = 'OMB')

compare <- union(x = cbo_outlays, y = omb_outlays)
compare <- compare %>% filter(fiscal_year %in% c(2019, 2020, 2021, 2022, 2023))
```