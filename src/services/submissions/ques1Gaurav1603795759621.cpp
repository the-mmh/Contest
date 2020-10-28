#include <bits/stdc++.h>
using namespace std;
#define ll long long int
#define fast ios_base::sync_with_stdio(false);  cin.tie(NULL); cout.tie(NULL);
#define scan(a,n) for(long long int index=0;index<n;index++) cin>>a[index];
#define print(a,n) for(long long int index=0;index<n;index++) cout<<a[index]<<" ";cout<<endl;
#define mod 1000000007
#define pb push_back
#define mp make_pair
#define ss second
#define ff first
#define vli vector<long long int>
#define vlli vector<pair<long long int,long long int>>
#define vsi vector<string>
#define vci vector<char>
#define all(n) n.begin(),n.end()
#define forn(i,a,b) for(i=a;i<b;i++)
ll mul(ll x,ll y){  return (x*y)%mod;}
ll power(ll x, ll y) {ll res = 1; x %= mod; while (y) {if (y & 1)res = mul(res, x); y >>= 1; x = mul(x, x);} return res;}
ll mod_inv(ll x) {return power(x, mod - 2);}


 
int main() {
  fast;
    ll t;
    cin>>t;
    while(t--){
        ll n,m;
        cin>>n>>m;
        ll a[n];
        scan(a,n);
        ll f=0;
        ll i,j,sum;
        for(i=0;i<n;i++){
            sum=0;
            for(j=i;j<n;j++){
                sum+=a[j];
                if(sum==m){
                    f=1;
                    break;
                }
            }
             if(f==1) break;
        }
        cout<<(f?"YES ":"NO ");
        
        

    }   
return 0;    
 }  